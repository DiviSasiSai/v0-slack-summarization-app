import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { SlackClient } from "@/lib/slack"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import type { ChatSession } from "@/lib/db-types"

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const channelId = searchParams.get("channelId")
  const since = searchParams.get("since") // timestamp to fetch messages after

  if (!channelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 })
  }

  try {
    const slackClient = new SlackClient(user.slack_access_token)
    await slackClient.preloadUsers()

    // Get the last processed timestamp for this channel/user
    const db = await getDatabase()
    const session = await db.collection<ChatSession>(COLLECTIONS.CHAT_SESSIONS).findOne({
      user_id: user.slack_user_id,
      channel_id: channelId,
    })

    // Use provided 'since' param, or last processed timestamp, or fetch recent messages
    const oldest = since || session?.last_processed_ts || undefined
    const messages = await slackClient.getChannelMessages(channelId, oldest, 50)

    return NextResponse.json({
      messages,
      hasMore: messages.length >= 50,
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}
