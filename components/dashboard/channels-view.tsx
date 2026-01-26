"use client";

import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hash, Lock, Users, FileText, ArrowRight } from "lucide-react";

export function ChannelsView() {
  const { channels, setSelectedChannel, setActiveView } = useAppStore();

  const handleSummarize = (channel: (typeof channels)[0]) => {
    setSelectedChannel(channel);
    setActiveView("summaries");
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Channels</h1>
          <p className="text-sm text-muted-foreground">
            Select a channel to generate AI summaries
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Users className="h-3 w-3" />
          {channels.length} channels
        </Badge>
      </header>

      {/* Channel Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <Card
              key={channel.id}
              className="group cursor-pointer border-border bg-card transition-colors hover:border-primary/50"
              onClick={() => handleSummarize(channel)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {channel.type === "private" ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent">
                        <Lock className="h-4 w-4 text-accent-foreground" />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                        <Hash className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <CardTitle className="text-base text-card-foreground">
                      {channel.name}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {channel.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {channel.memberCount} members
                </CardDescription>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Summarize
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
