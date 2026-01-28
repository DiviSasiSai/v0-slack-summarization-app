export interface User {
  id: string
  email?: string
  name: string
  avatar?: string
  teamName?: string
}

export interface Channel {
  id: string
  name: string
  type: "public" | "private"
  memberCount?: number
  topic?: string
  purpose?: string
}

export interface SlackMessage {
  ts: string
  user: string
  user_name?: string
  text: string
  timestamp: Date
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  slackMessages?: SlackMessage[]
}

export interface AuthUser {
  authenticated: boolean
  user?: User
}
