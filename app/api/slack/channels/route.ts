import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { SlackClient } from "@/lib/slack"

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const slackClient = new SlackClient(user.slack_access_token)
    const channels = await slackClient.getChannels()

    return NextResponse.json({
      channels: channels.map((c) => ({
        id: c.id,
        name: c.name,
        isPrivate: c.is_private,
        numMembers: c.num_members,
        topic: c.topic?.value,
        purpose: c.purpose?.value,
      })),
    })
  } catch (error) {
    console.error("Error fetching channels:", error)
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 })
  }
}
