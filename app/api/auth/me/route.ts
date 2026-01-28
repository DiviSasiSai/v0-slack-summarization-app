import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.slack_user_id,
      name: user.slack_user_name,
      email: user.slack_user_email,
      image: user.slack_user_image,
      teamName: user.slack_team_name,
    },
  })
}
