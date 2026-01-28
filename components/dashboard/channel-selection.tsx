"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import type { Channel } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Hash, Lock, Users, Sparkles, MessageSquare, RefreshCw, LogOut, Bell } from "lucide-react"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { useRouter } from "next/navigation"

export function ChannelSelection() {
  const router = useRouter()
  const { user, channels, setChannels, setSelectedChannel, logout } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const {
    isSupported: pushSupported,
    permission: pushPermission,
    isSubscribed,
    isLoading: pushLoading,
    subscribe: subscribePush,
  } = usePushNotifications()

  const fetchChannels = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/slack/channels")
      if (!response.ok) {
        if (response.status === 401) {
          // Session expired, redirect to login
          logout()
          router.push("/")
          return
        }
        throw new Error("Failed to fetch channels")
      }
      const data = await response.json()
      const mappedChannels: Channel[] = data.channels.map((c: { id: string; name: string; isPrivate: boolean; numMembers?: number; topic?: string; purpose?: string }) => ({
        id: c.id,
        name: c.name,
        type: c.isPrivate ? "private" : "public",
        memberCount: c.numMembers,
        topic: c.topic,
        purpose: c.purpose,
      }))
      setChannels(mappedChannels)
    } catch (err) {
      console.error("Error fetching channels:", err)
      setError("Failed to load channels. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (channels.length === 0) {
      fetchChannels()
    }
  }, [])

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel)
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

  const handleEnableNotifications = async () => {
    await subscribePush()
  }

  const publicChannels = channels.filter((c) => c.type === "public")
  const privateChannels = channels.filter((c) => c.type === "private")

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-5">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Welcome back, {user?.name?.split(" ")[0]}
                </h1>
                <p className="text-muted-foreground">
                  {user?.teamName && <span className="text-sm">{user.teamName} - </span>}
                  Select a channel to start receiving AI summaries
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pushSupported && pushPermission !== "denied" && !isSubscribed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnableNotifications}
                  disabled={pushLoading}
                  className="gap-2"
                >
                  <Bell className="h-4 w-4" />
                  Enable Notifications
                </Button>
              )}
              {isSubscribed && (
                <Badge variant="secondary" className="gap-1">
                  <Bell className="h-3 w-3" />
                  Notifications On
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Channel Selection */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-8">
          {/* Refresh Button */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {channels.length} channels available
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchChannels}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && channels.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Loading channels...</span>
              </div>
            </div>
          )}

          {/* Public Channels */}
          {publicChannels.length > 0 && (
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <Hash className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-medium text-foreground">
                  Public Channels
                </h2>
                <Badge variant="secondary" className="ml-2">
                  {publicChannels.length}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {publicChannels.map((channel) => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    onClick={() => handleChannelSelect(channel)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Private Channels */}
          {privateChannels.length > 0 && (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-medium text-foreground">
                  Private Channels
                </h2>
                <Badge variant="secondary" className="ml-2">
                  {privateChannels.length}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {privateChannels.map((channel) => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    onClick={() => handleChannelSelect(channel)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No Channels */}
          {!isLoading && channels.length === 0 && !error && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No channels found. Make sure your Slack app is added to channels.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function ChannelCard({
  channel,
  onClick,
}: {
  channel: Channel
  onClick: () => void
}) {
  return (
    <Card
      className="cursor-pointer transition-all hover:border-primary/50 hover:bg-muted/50"
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary">
          {channel.type === "private" ? (
            <Lock className="h-5 w-5 text-accent" />
          ) : (
            <Hash className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium text-foreground">
              #{channel.name}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {channel.memberCount && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {channel.memberCount} members
              </span>
            )}
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              View chat
            </span>
          </div>
          {channel.topic && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {channel.topic}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
