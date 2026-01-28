import type { SlackChannel, SlackUser, SlackMessageData } from "./db-types"

const SLACK_API_BASE = "https://slack.com/api"

interface SlackApiResponse {
  ok: boolean
  error?: string
}

interface ChannelsResponse extends SlackApiResponse {
  channels: SlackChannel[]
}

interface ConversationHistoryResponse extends SlackApiResponse {
  messages: Array<{
    type: string
    user?: string
    text: string
    ts: string
    bot_id?: string
  }>
  has_more: boolean
  response_metadata?: {
    next_cursor: string
  }
}

interface UsersInfoResponse extends SlackApiResponse {
  user: SlackUser
}

interface UsersListResponse extends SlackApiResponse {
  members: SlackUser[]
}

export class SlackClient {
  private accessToken: string
  private userCache: Map<string, SlackUser> = new Map()

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private async request<T extends SlackApiResponse>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${SLACK_API_BASE}/${endpoint}`)
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value)
    })

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })

    const data = await response.json()
    if (!data.ok) {
      throw new Error(data.error || "Slack API error")
    }
    return data as T
  }

  async getChannels(): Promise<SlackChannel[]> {
    const publicChannels = await this.request<ChannelsResponse>("conversations.list", {
      types: "public_channel,private_channel",
      exclude_archived: "true",
      limit: "200",
    })

    return publicChannels.channels.filter((c) => c.is_member)
  }

  async getChannelMessages(channelId: string, oldest?: string, limit = 100): Promise<SlackMessageData[]> {
    const params: Record<string, string> = {
      channel: channelId,
      limit: limit.toString(),
    }
    if (oldest) {
      params.oldest = oldest
    }

    const response = await this.request<ConversationHistoryResponse>("conversations.history", params)

    const messages: SlackMessageData[] = []
    for (const msg of response.messages) {
      if (msg.type === "message" && !msg.bot_id && msg.user) {
        const userName = await this.getUserName(msg.user)
        messages.push({
          ts: msg.ts,
          user: msg.user,
          user_name: userName,
          text: msg.text,
          timestamp: new Date(parseFloat(msg.ts) * 1000),
        })
      }
    }

    return messages.reverse() // oldest first
  }

  async getUserName(userId: string): Promise<string> {
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId)!.real_name || this.userCache.get(userId)!.name
    }

    try {
      const response = await this.request<UsersInfoResponse>("users.info", { user: userId })
      this.userCache.set(userId, response.user)
      return response.user.real_name || response.user.name
    } catch {
      return userId
    }
  }

  async getUserInfo(userId: string): Promise<SlackUser | null> {
    try {
      const response = await this.request<UsersInfoResponse>("users.info", { user: userId })
      return response.user
    } catch {
      return null
    }
  }

  async preloadUsers(): Promise<void> {
    try {
      const response = await this.request<UsersListResponse>("users.list", { limit: "200" })
      for (const user of response.members) {
        this.userCache.set(user.id, user)
      }
    } catch {
      // ignore errors
    }
  }
}

// OAuth URL generator
export function getSlackOAuthUrl(state: string): string {
  const clientId = process.env.SLACK_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/slack/callback`
  
  // User scopes - these are for the user token
  const userScopes = [
    "channels:read",
    "channels:history",
    "groups:read",
    "groups:history",
    "users:read",
  ].join(",")

  const url = new URL("https://slack.com/oauth/v2/authorize")
  url.searchParams.append("client_id", clientId!)
  url.searchParams.append("user_scope", userScopes)
  url.searchParams.append("redirect_uri", redirectUri)
  url.searchParams.append("state", state)

  return url.toString()
}

// Exchange code for token
export async function exchangeSlackCode(code: string): Promise<{
  access_token: string
  team: { id: string; name: string }
  authed_user: { id: string; access_token: string }
}> {
  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/slack/callback`,
    }),
  })

  const data = await response.json()
  if (!data.ok) {
    throw new Error(data.error || "Failed to exchange code")
  }

  return data
}
