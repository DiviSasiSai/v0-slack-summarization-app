import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import type { ChatSession, ChatMessage, SlackMessageData } from "@/lib/db-types"

interface AgentRequest {
  channelId: string
  channelName: string
  messages: SlackMessageData[]
  userQuery?: string
  deviceId?: string
}

interface AgentResponse {
  response: string
  shouldNotify?: boolean
  notificationTitle?: string
  notificationBody?: string
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body: AgentRequest = await request.json()
    const { channelId, channelName, messages, userQuery, deviceId } = body

    if (!channelId || !messages) {
      return NextResponse.json({ error: "channelId and messages are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const now = new Date()

    // Upsert chat session
    await db.collection<ChatSession>(COLLECTIONS.CHAT_SESSIONS).updateOne(
      {
        user_id: user.slack_user_id,
        channel_id: channelId,
      },
      {
        $set: {
          channel_name: channelName,
          updated_at: now,
          last_processed_ts: messages.length > 0 ? messages[messages.length - 1].ts : undefined,
        },
        $setOnInsert: {
          user_id: user.slack_user_id,
          channel_id: channelId,
          created_at: now,
        },
      },
      { upsert: true }
    )

    // Format messages for the agent
    const formattedMessages = messages
      .map((m) => `[${m.user_name || m.user}]: ${m.text}`)
      .join("\n")

    // Call your FastAPI agent
    const agentApiUrl = process.env.AGENT_API_URL
    let agentResponse: AgentResponse

    if (agentApiUrl) {
      try {
        const agentReq = await fetch(agentApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.slack_user_id,
            team_id: user.slack_team_id,
            channel_id: channelId,
            channel_name: channelName,
            messages: formattedMessages,
            user_query: userQuery || "Summarize these new messages and highlight any important items or action items.",
            device_id: deviceId,
            slack_access_token: user.slack_access_token,
          }),
        })

        if (!agentReq.ok) {
          throw new Error("Agent API error")
        }

        agentResponse = await agentReq.json()
      } catch (agentError) {
        console.error("Agent API error:", agentError)
        // Fallback to basic summary
        agentResponse = {
          response: generateBasicSummary(messages, channelName),
        }
      }
    } else {
      // No agent configured, use basic summary
      agentResponse = {
        response: generateBasicSummary(messages, channelName),
      }
    }

    // Store the conversation
    const chatMessage: ChatMessage = {
      session_id: `${user.slack_user_id}-${channelId}`,
      user_id: user.slack_user_id,
      role: "assistant",
      content: agentResponse.response,
      slack_messages: messages,
      created_at: now,
    }

    await db.collection<ChatMessage>(COLLECTIONS.MESSAGES).insertOne(chatMessage)

    return NextResponse.json({
      response: agentResponse.response,
      messagesProcessed: messages.length,
      shouldNotify: agentResponse.shouldNotify,
      notificationTitle: agentResponse.notificationTitle,
      notificationBody: agentResponse.notificationBody,
    })
  } catch (error) {
    console.error("Error processing agent chat:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

function generateBasicSummary(messages: SlackMessageData[], channelName: string): string {
  if (messages.length === 0) {
    return `No new messages in #${channelName}.`
  }

  const uniqueUsers = [...new Set(messages.map((m) => m.user_name || m.user))]
  const summary = `**Summary of ${messages.length} new messages in #${channelName}:**\n\n`
  const participants = `**Participants:** ${uniqueUsers.join(", ")}\n\n`

  let highlights = "**Recent messages:**\n"
  const recentMessages = messages.slice(-5)
  for (const msg of recentMessages) {
    highlights += `- **${msg.user_name || msg.user}:** ${msg.text.substring(0, 100)}${msg.text.length > 100 ? "..." : ""}\n`
  }

  return summary + participants + highlights
}

// GET endpoint to fetch chat history
export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const channelId = searchParams.get("channelId")

  if (!channelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 })
  }

  try {
    const db = await getDatabase()
    const messages = await db
      .collection<ChatMessage>(COLLECTIONS.MESSAGES)
      .find({
        session_id: `${user.slack_user_id}-${channelId}`,
      })
      .sort({ created_at: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json({
      messages: messages.reverse(),
    })
  } catch (error) {
    console.error("Error fetching chat history:", error)
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
  }
}
