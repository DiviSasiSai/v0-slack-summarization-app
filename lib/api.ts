// API client for Slack Summarization App

export interface AgentChatRequest {
  channelId: string
  channelName: string
  messages: Array<{
    ts: string
    user: string
    user_name?: string
    text: string
    timestamp: Date
  }>
  userQuery?: string
  deviceId?: string
}

export interface AgentChatResponse {
  response: string
  messagesProcessed: number
  shouldNotify?: boolean
  notificationTitle?: string
  notificationBody?: string
}

export async function sendAgentChat(request: AgentChatRequest): Promise<AgentChatResponse> {
  const response = await fetch("/api/agent/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(error.error || "Failed to send message to agent")
  }

  return response.json()
}

export async function fetchSlackChannels() {
  const response = await fetch("/api/slack/channels")
  if (!response.ok) {
    throw new Error("Failed to fetch channels")
  }
  return response.json()
}

export async function fetchSlackMessages(channelId: string, since?: string) {
  const params = new URLSearchParams({ channelId })
  if (since) params.append("since", since)
  
  const response = await fetch(`/api/slack/messages?${params}`)
  if (!response.ok) {
    throw new Error("Failed to fetch messages")
  }
  return response.json()
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" })
}
