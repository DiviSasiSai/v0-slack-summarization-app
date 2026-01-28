"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import type { ChatMessage, SlackMessage } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Send,
  Sparkles,
  User,
  Hash,
  Lock,
  RefreshCw,
  LogOut,
  ArrowLeft,
  MessageSquare,
} from "lucide-react"
import { usePushNotifications } from "@/hooks/use-push-notifications"

export function ChannelChat() {
  const router = useRouter()
  const {
    user,
    selectedChannel,
    addChatMessage,
    getChatMessages,
    logout,
    setSelectedChannel,
  } = useAppStore()

  const { deviceId } = usePushNotifications()

  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingMessages, setIsFetchingMessages] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const channelId = selectedChannel?.id || ""
  const messages = getChatMessages(channelId)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Add welcome message when channel is first opened
  useEffect(() => {
    if (!selectedChannel || !user) return

    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `sys_${Date.now()}`,
        role: "system",
        content: `Connected to #${selectedChannel.name}. I'm your AI assistant. Click "Fetch & Summarize" to get the latest messages from this channel, and I'll provide you with a summary and highlight any important items.`,
        timestamp: new Date().toISOString(),
      }
      addChatMessage(channelId, welcomeMessage)
    }
  }, [selectedChannel, user, messages.length, addChatMessage, channelId])

  const fetchAndSummarize = async (userQuery?: string) => {
    if (!user || !selectedChannel) return

    setIsFetchingMessages(true)

    try {
      // Fetch new messages from Slack
      const messagesResponse = await fetch(`/api/slack/messages?channelId=${channelId}`)
      if (!messagesResponse.ok) {
        throw new Error("Failed to fetch messages")
      }
      const messagesData = await messagesResponse.json()
      const slackMessages: SlackMessage[] = messagesData.messages

      if (slackMessages.length === 0) {
        const noMessagesResponse: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: "assistant",
          content: `No new messages found in #${selectedChannel.name}. I'll check again when you click "Fetch & Summarize".`,
          timestamp: new Date().toISOString(),
        }
        addChatMessage(channelId, noMessagesResponse)
        return
      }

      // Send to agent for processing
      const agentResponse = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId,
          channelName: selectedChannel.name,
          messages: slackMessages,
          userQuery: userQuery || "Summarize these messages and highlight any important items or action items.",
          deviceId,
        }),
      })

      if (!agentResponse.ok) {
        throw new Error("Failed to get agent response")
      }

      const agentData = await agentResponse.json()

      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: agentData.response,
        timestamp: new Date().toISOString(),
        slackMessages,
      }
      addChatMessage(channelId, aiMessage)
    } catch (error) {
      console.error("Error fetching messages:", error)
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't fetch messages from the channel. Please check your connection and try again.",
        timestamp: new Date().toISOString(),
      }
      addChatMessage(channelId, errorMessage)
    } finally {
      setIsFetchingMessages(false)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || !user || !selectedChannel) return

    const text = input.trim()
    setInput("")
    setIsLoading(true)

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    }
    addChatMessage(channelId, userMessage)

    try {
      // Fetch latest messages and send with user query
      const messagesResponse = await fetch(`/api/slack/messages?channelId=${channelId}`)
      let slackMessages: SlackMessage[] = []
      
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json()
        slackMessages = messagesData.messages
      }

      // Send to agent with user's question
      const agentResponse = await fetch("/api/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId,
          channelName: selectedChannel.name,
          messages: slackMessages,
          userQuery: text,
          deviceId,
        }),
      })

      if (!agentResponse.ok) {
        throw new Error("Failed to get agent response")
      }

      const agentData = await agentResponse.json()

      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: agentData.response,
        timestamp: new Date().toISOString(),
      }
      addChatMessage(channelId, aiMessage)
    } catch (error) {
      console.error("Failed to send message:", error)
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't process your request. Please try again.",
        timestamp: new Date().toISOString(),
      }
      addChatMessage(channelId, errorMessage)
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleBack = () => {
    setSelectedChannel(null)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // Ignore errors
    }
    logout()
    router.push("/")
  }

  // Quick action buttons
  const quickActions = [
    {
      label: "Summarize today",
      message: "Summarize today's messages in this channel",
    },
    {
      label: "Action items",
      message: "What are the action items from recent discussions?",
    },
    {
      label: "Key decisions",
      message: "What decisions were made recently?",
    },
  ]

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            {selectedChannel?.type === "private" ? (
              <Lock className="h-5 w-5 text-accent" />
            ) : (
              <Hash className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <h1 className="font-semibold text-foreground">
              #{selectedChannel?.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              AI assistant active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => fetchAndSummarize()}
            disabled={isFetchingMessages}
            className="gap-2"
          >
            {isFetchingMessages ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            Fetch & Summarize
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {(isLoading || isFetchingMessages) && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {isFetchingMessages ? "Fetching messages..." : "Thinking..."}
                </span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="border-t border-border px-4 py-2">
        <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={() => {
                setInput(action.message)
                inputRef.current?.focus()
              }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Input
            ref={inputRef}
            placeholder="Ask about this channel..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isFetchingMessages}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading || isFetchingMessages}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  // System messages (welcome)
  if (message.role === "system") {
    return (
      <div className="flex justify-center">
        <div className="rounded-lg bg-secondary/50 px-4 py-2 text-center text-sm text-muted-foreground">
          {message.content}
        </div>
      </div>
    )
  }

  const isUser = message.role === "user"

  return (
    <div
      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {isUser ? (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
      <div
        className={`max-w-[70%] rounded-lg px-4 py-3 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        <div
          className={`whitespace-pre-wrap text-sm ${isUser ? "" : "text-foreground"}`}
          dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
        />
        <p
          className={`mt-1 text-xs ${
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  )
}

function formatMarkdown(text: string): string {
  // Simple markdown formatting
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br />")
}
