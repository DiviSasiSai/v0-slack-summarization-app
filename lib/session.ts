import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { getDatabase, COLLECTIONS } from "./mongodb"
import type { DbUser } from "./db-types"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production")

export interface SessionPayload {
  userId: string
  slackUserId: string
  slackTeamId: string
  exp: number
}

export async function createSession(user: DbUser): Promise<string> {
  const token = await new SignJWT({
    userId: user._id?.toString(),
    slackUserId: user.slack_user_id,
    slackTeamId: user.slack_team_id,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret)

  return token
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  if (!token) return null
  return verifySession(token)
}

export async function getCurrentUser(): Promise<DbUser | null> {
  const session = await getSession()
  if (!session) return null

  const db = await getDatabase()
  const user = await db.collection<DbUser>(COLLECTIONS.USERS).findOne({
    slack_user_id: session.slackUserId,
    slack_team_id: session.slackTeamId,
  })

  return user
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}
