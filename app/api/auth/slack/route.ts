import { NextResponse } from "next/server"
import { getSlackOAuthUrl } from "@/lib/slack"
import { cookies } from "next/headers"

export async function GET() {
  // Generate a random state for CSRF protection
  const state = crypto.randomUUID()

  // Store state in cookie for verification
  const cookieStore = await cookies()
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  })

  const authUrl = getSlackOAuthUrl(state)
  return NextResponse.redirect(authUrl)
}
