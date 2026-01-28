import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/session"
import { getDatabase, COLLECTIONS } from "@/lib/mongodb"
import type { PushSubscription } from "@/lib/db-types"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { subscription, deviceId } = body

    if (!subscription || !deviceId) {
      return NextResponse.json({ error: "subscription and deviceId are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const now = new Date()

    // Upsert push subscription for this user/device combination
    await db.collection<PushSubscription>(COLLECTIONS.PUSH_SUBSCRIPTIONS).updateOne(
      {
        user_id: user.slack_user_id,
        device_id: deviceId,
      },
      {
        $set: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
          updated_at: now,
        },
        $setOnInsert: {
          user_id: user.slack_user_id,
          device_id: deviceId,
          created_at: now,
        },
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving push subscription:", error)
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 })
  }
}

// DELETE endpoint to unsubscribe
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { deviceId } = body

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required" }, { status: 400 })
    }

    const db = await getDatabase()
    await db.collection<PushSubscription>(COLLECTIONS.PUSH_SUBSCRIPTIONS).deleteOne({
      user_id: user.slack_user_id,
      device_id: deviceId,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting push subscription:", error)
    return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 })
  }
}
