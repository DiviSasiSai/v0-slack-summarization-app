import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { exchangeSlackCode, SlackClient } from "@/lib/slack"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import { createSession, setSessionCookie } from "@/lib/session"
import type { DbUser } from "@/lib/db-types"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""

  if (error) {
    return NextResponse.redirect(`${appUrl}/?error=${error}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/?error=missing_params`)
  }

  // Verify state
  const cookieStore = await cookies()
  const storedState = cookieStore.get("oauth_state")?.value

  if (state !== storedState) {
    return NextResponse.redirect(`${appUrl}/?error=invalid_state`)
  }

  // Clear the state cookie
  cookieStore.delete("oauth_state")

  try {
    // Exchange code for token
    const tokenData = await exchangeSlackCode(code)

    // Get user info from Slack
    const slackClient = new SlackClient(tokenData.authed_user.access_token)
    const userInfo = await slackClient.getUserInfo(tokenData.authed_user.id)

    // Upsert user in database
    const db = await getDatabase()
    const now = new Date()

    const userData: Omit<DbUser, "_id"> = {
      slack_user_id: tokenData.authed_user.id,
      slack_team_id: tokenData.team.id,
      slack_team_name: tokenData.team.name,
      slack_access_token: tokenData.authed_user.access_token,
      slack_bot_token: tokenData.access_token,
      slack_user_name: userInfo?.real_name || userInfo?.name || tokenData.authed_user.id,
      slack_user_email: userInfo?.profile?.email,
      slack_user_image: userInfo?.profile?.image_48,
      created_at: now,
      updated_at: now,
    }

    const result = await db.collection<DbUser>(COLLECTIONS.USERS).findOneAndUpdate(
      {
        slack_user_id: tokenData.authed_user.id,
        slack_team_id: tokenData.team.id,
      },
      {
        $set: {
          ...userData,
          updated_at: now,
        },
        $setOnInsert: {
          created_at: now,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    )

    if (!result) {
      throw new Error("Failed to create user")
    }

    // Create session
    const sessionToken = await createSession(result)
    await setSessionCookie(sessionToken)

    return NextResponse.redirect(`${appUrl}/dashboard`)
  } catch (err) {
    console.error("OAuth callback error:", err)
    return NextResponse.redirect(`${appUrl}/?error=auth_failed`)
  }
}
