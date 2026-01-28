import { ObjectId } from "mongodb"

export interface DbUser {
  _id?: ObjectId
  odoo_access_token?: string
  slack_user_id: string
  slack_team_id: string
  slack_team_name: string
  slack_access_token: string
  slack_bot_token?: string
  slack_user_name: string
  slack_user_email?: string
  slack_user_image?: string
  created_at: Date
  updated_at: Date
}

export interface PushSubscription {
  _id?: ObjectId
  user_id: string // slack_user_id
  device_id: string // unique device identifier
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  created_at: Date
  updated_at: Date
}

export interface ChatSession {
  _id?: ObjectId
  user_id: string // slack_user_id
  channel_id: string
  channel_name: string
  created_at: Date
  updated_at: Date
  last_processed_ts?: string // last processed message timestamp
}

export interface ChatMessage {
  _id?: ObjectId
  session_id: string
  user_id: string
  role: "user" | "assistant" | "system"
  content: string
  slack_messages?: SlackMessageData[]
  created_at: Date
}

export interface SlackMessageData {
  ts: string
  user: string
  user_name?: string
  text: string
  timestamp: Date
}

export interface SlackChannel {
  id: string
  name: string
  is_private: boolean
  is_member: boolean
  num_members?: number
  topic?: {
    value: string
  }
  purpose?: {
    value: string
  }
}

export interface SlackUser {
  id: string
  name: string
  real_name?: string
  profile?: {
    image_48?: string
    email?: string
  }
}
