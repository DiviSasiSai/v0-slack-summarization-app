"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import type { Channel } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Hash, Lock, Users, Sparkles, MessageSquare } from "lucide-react";

// Mock channels data - in production, fetch from Slack API
const mockChannels: Channel[] = [
  { id: "1", name: "general", type: "public", memberCount: 45, unreadCount: 12 },
  { id: "2", name: "engineering", type: "public", memberCount: 23, unreadCount: 5 },
  { id: "3", name: "design", type: "public", memberCount: 12, unreadCount: 0 },
  { id: "4", name: "product", type: "public", memberCount: 18, unreadCount: 3 },
  { id: "5", name: "marketing", type: "public", memberCount: 15, unreadCount: 0 },
  { id: "6", name: "leadership", type: "private", memberCount: 5, unreadCount: 2 },
  { id: "7", name: "hr-team", type: "private", memberCount: 3, unreadCount: 0 },
  { id: "8", name: "random", type: "public", memberCount: 42, unreadCount: 8 },
  { id: "9", name: "announcements", type: "public", memberCount: 50, unreadCount: 1 },
  { id: "10", name: "support", type: "public", memberCount: 28, unreadCount: 0 },
];

export function ChannelSelection() {
  const { user, channels, setChannels, setSelectedChannel } = useAppStore();

  useEffect(() => {
    // Initialize channels on mount
    if (channels.length === 0) {
      setChannels(mockChannels);
    }
  }, [channels.length, setChannels]);

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
  };

  const publicChannels = channels.filter((c) => c.type === "public");
  const privateChannels = channels.filter((c) => c.type === "private");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-5">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Welcome back, {user?.name?.split(" ")[0]}
              </h1>
              <p className="text-muted-foreground">
                Select a channel to start receiving AI summaries and reminders
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Channel Selection */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-8">
          {/* Public Channels */}
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
        </div>
      </ScrollArea>
    </div>
  );
}

function ChannelCard({
  channel,
  onClick,
}: {
  channel: Channel;
  onClick: () => void;
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
            {channel.unreadCount && channel.unreadCount > 0 ? (
              <Badge className="bg-primary text-primary-foreground">
                {channel.unreadCount}
              </Badge>
            ) : null}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {channel.memberCount} members
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              View chat
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
