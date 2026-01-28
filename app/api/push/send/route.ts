import { NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import type { PushSubscription } from "@/lib/db-types"

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    `mailto:admin@${process.env.NEXT_PUBLIC_APP_URL || "localhost"}`,
    vapidPublicKey,
    vapidPrivateKey
  )
}

interface SendNotificationRequest {
  user_id: string
  device_id?: string // Optional - if not provided, send to all user's devices
  title: string
  body: string
  data?: Record<string, unknown>
  icon?: string
  badge?: string
  url?: string
}

// This endpoint is called by your FastAPI agent to send notifications
export async function POST(request: NextRequest) {
  // Verify the request is from your agent (you can add API key verification here)
  const authHeader = request.headers.get("authorization")
  const agentApiKey = process.env.AGENT_API_KEY

  // Optional: Add API key verification for production
  if (agentApiKey && authHeader !== `Bearer ${agentApiKey}`) {
    // For now, allow requests without key if AGENT_API_KEY is not set
    if (agentApiKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const body: SendNotificationRequest = await request.json()
    const { user_id, device_id, title, body: notificationBody, data, icon, badge, url } = body

    if (!user_id || !title || !notificationBody) {
      return NextResponse.json(
        { error: "user_id, title, and body are required" },
        { status: 400 }
      )
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: "VAPID keys not configured" },
        { status: 500 }
      )
    }

    const db = await getDatabase()

    // Find subscriptions for this user (and optionally specific device)
    const query: Record<string, string> = { user_id }
    if (device_id) {
      query.device_id = device_id
    }

    const subscriptions = await db
      .collection<PushSubscription>(COLLECTIONS.PUSH_SUBSCRIPTIONS)
      .find(query)
      .toArray()

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No subscriptions found for user",
        sentCount: 0,
      })
    }

    const payload = JSON.stringify({
      title,
      body: notificationBody,
      icon: icon || "/icon.svg",
      badge: badge || "/icon.svg",
      data: {
        url: url || "/dashboard",
        ...data,
      },
    })

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            payload
          )
          return { deviceId: sub.device_id, success: true }
        } catch (error: unknown) {
          // Remove invalid subscriptions
          if (error && typeof error === "object" && "statusCode" in error) {
            const webPushError = error as { statusCode: number }
            if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
              await db.collection<PushSubscription>(COLLECTIONS.PUSH_SUBSCRIPTIONS).deleteOne({
                _id: sub._id,
              })
            }
          }
          return { deviceId: sub.device_id, success: false, error }
        }
      })
    )

    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length

    return NextResponse.json({
      success: true,
      sentCount: successCount,
      totalDevices: subscriptions.length,
    })
  } catch (error) {
    console.error("Error sending push notification:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}

// GET endpoint to check subscription status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get("user_id")
  const deviceId = searchParams.get("device_id")

  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 })
  }

  const db = await getDatabase()
  const query: Record<string, string> = { user_id: userId }
  if (deviceId) {
    query.device_id = deviceId
  }

  const count = await db
    .collection<PushSubscription>(COLLECTIONS.PUSH_SUBSCRIPTIONS)
    .countDocuments(query)

  return NextResponse.json({
    hasSubscription: count > 0,
    deviceCount: count,
  })
}
