"use client";

import React from "react"

import { useState, useRef, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { sendUserMessage, sendSlackMessageToAgent } from "@/lib/api";
import type { ChatMessage, Reminder } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Sparkles,
  User,
  ArrowLeft,
  Hash,
  Lock,
  Bell,
  RefreshCw,
  ImageIcon,
} from "lucide-react";
import { NotificationsPanel } from "./notifications-panel";

export function ChannelChat() {
  const {
    user,
    selectedChannel,
    setSelectedChannel,
    chatMessagesByChannel,
    addChatMessage,
    getChatMessages,
    addReminder,
    reminders,
    showNotifications,
    setShowNotifications,
  } = useAppStore();

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const channelId = selectedChannel?.id || "";
  const messages = getChatMessages(channelId);
  const unreadReminders = reminders.filter((r) => !r.isRead && !r.isCompleted);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessagesByChannel, channelId]);

  // Simulate incoming Slack messages (in production, use WebSocket or polling)
  useEffect(() => {
    if (!selectedChannel || !user) return;

    // Add initial system message if channel is empty
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `sys_${Date.now()}`,
        role: "system",
        content: `Connected to #${selectedChannel.name}. I'm monitoring this channel 24/7 and will summarize important discussions, extract action items, and automatically create reminders for you.`,
        timestamp: new Date().toISOString(),
      };
      addChatMessage(channelId, welcomeMessage);
    }

    // Simulate incoming Slack messages every 30 seconds for demo
    const interval = setInterval(() => {
      simulateIncomingSlackMessage();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedChannel, user]);

  const simulateIncomingSlackMessage = useCallback(async () => {
    if (!selectedChannel || !user) return;

    const mockMessages = [
      { sender: "John", message: "Hey team, reminder that the sprint review is tomorrow at 2 PM" },
      { sender: "Sarah", message: "Can someone review my PR #234? It's blocking the release" },
      { sender: "Mike", message: "FYI: The API endpoint for user auth is now live in staging" },
      { sender: "Lisa", message: "Action item from yesterday's meeting: Update the documentation by Friday" },
      { sender: "Alex", message: "Quick heads up - I'll be OOO next Monday" },
    ];

    const randomMessage = mockMessages[Math.floor(Math.random() * mockMessages.length)];
    const now = new Date();

    // Add Slack message to chat
    const slackMessage: ChatMessage = {
      id: `slack_${Date.now()}`,
      role: "slack",
      content: randomMessage.message,
      timestamp: now.toISOString(),
      sender: randomMessage.sender,
      channelName: selectedChannel.name,
    };
    addChatMessage(channelId, slackMessage);

    // Send to agent for processing
    try {
      const response = await sendSlackMessageToAgent({
        device_id: `web_${user.id}`,
        email: user.email,
        sender: randomMessage.sender,
        message: randomMessage.message,
        time: now.toLocaleTimeString(),
        date: now.toLocaleDateString(),
        group: selectedChannel.name,
      });

      // If agent responds, add it to chat
      if (response.response) {
        const aiMessage: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: "assistant",
          content: response.response,
          timestamp: new Date().toISOString(),
        };
        addChatMessage(channelId, aiMessage);
      }

      // If agent creates a reminder, add it
      if (response.reminder) {
        const newReminder: Reminder = {
          id: `rem_${Date.now()}`,
          title: response.reminder.title,
          description: response.reminder.description,
          channelId: selectedChannel.id,
          channelName: selectedChannel.name,
          dueDate: response.reminder.dueDate,
          dueTime: response.reminder.dueTime,
          isCompleted: false,
          isRead: false,
          createdAt: new Date().toISOString(),
          source: "auto",
        };
        addReminder(newReminder);
      }
    } catch (error) {
      console.log("[v0] Failed to send Slack message to agent:", error);
    }
  }, [selectedChannel, user, channelId, addChatMessage, addReminder]);

  const handleSendMessage = async () => {
    if (!input.trim() || !user || !selectedChannel) return;

    const text = input.trim();
    setInput("");
    setIsLoading(true);

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    addChatMessage(channelId, userMessage);

    try {
      // Send to agent
      const response = await sendUserMessage({
        device_id: `web_${user.id}`,
        email: user.email,
        message: text,
      });

      // Add agent response
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: response.response || "I processed your request.",
        timestamp: new Date().toISOString(),
      };
      addChatMessage(channelId, aiMessage);

      // Handle auto-generated reminder
      if (response.reminder) {
        const newReminder: Reminder = {
          id: `rem_${Date.now()}`,
          title: response.reminder.title,
          description: response.reminder.description,
          channelId: selectedChannel.id,
          channelName: selectedChannel.name,
          dueDate: response.reminder.dueDate,
          dueTime: response.reminder.dueTime,
          isCompleted: false,
          isRead: false,
          createdAt: new Date().toISOString(),
          source: "auto",
        };
        addReminder(newReminder);
      }
    } catch (error) {
      console.log("[v0] Failed to send message:", error);
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't process your request. Please try again.",
        timestamp: new Date().toISOString(),
      };
      addChatMessage(channelId, errorMessage);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBack = () => {
    setSelectedChannel(null);
  };

  // Quick action buttons
  const quickActions = [
    { label: "Summarize today", message: "Summarize today's messages in this channel" },
    { label: "Action items", message: "What are the action items from recent discussions?" },
    { label: "Key decisions", message: "What decisions were made recently?" },
  ];

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
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
              AI monitoring active
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="relative bg-transparent"
          onClick={() => setShowNotifications(true)}
        >
          <Bell className="h-4 w-4" />
          {unreadReminders.length > 0 && (
            <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-destructive p-0 text-xs text-destructive-foreground">
              {unreadReminders.length}
            </Badge>
          )}
        </Button>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} user={user} />
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
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
                setInput(action.message);
                inputRef.current?.focus();
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
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && <NotificationsPanel />}
    </div>
  );
}

function MessageBubble({
  message,
  user,
}: {
  message: ChatMessage;
  user: { name: string; avatar?: string } | null;
}) {
  if (message.role === "system") {
    return (
      <div className="flex justify-center">
        <div className="rounded-lg bg-secondary/50 px-4 py-2 text-center text-sm text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === "slack") {
    return (
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 shrink-0 border border-border">
          <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
            {message.sender?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{message.sender}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground">{message.content}</p>
          {message.hasImage && (
            <div className="mt-2 flex items-center gap-2 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
              <ImageIcon className="h-3 w-3" />
              Image attached
            </div>
          )}
        </div>
      </div>
    );
  }

  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
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
        <p className={`whitespace-pre-wrap text-sm ${isUser ? "" : "text-foreground"}`}>
          {message.content}
        </p>
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
  );
}
