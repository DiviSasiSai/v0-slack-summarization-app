"use client";

import React from "react"

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { sendUserMessage } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  Send,
  Sparkles,
  User,
  MessageCircle,
  Trash2,
  RefreshCw,
} from "lucide-react";

const suggestedQuestions = [
  "What were the main topics discussed in #engineering this week?",
  "Summarize the action items from #product discussions",
  "Are there any deadlines mentioned in #general?",
  "What decisions were made in #design yesterday?",
];

export function ChatView() {
  const { user, chatMessages, addChatMessage, clearChat } = useAppStore();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || !user) return;

    setInput("");
    setIsLoading(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMessage);

    try {
      // Call the AI agent API
      await sendUserMessage({
        device_id: `web_${user.id}`,
        email: user.email,
        message: text,
      });

      // Simulate AI response (in production, this would come from the API)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const aiResponse = generateMockResponse(text);
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };
      addChatMessage(assistantMessage);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content:
          "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date().toISOString(),
      };
      addChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">AI Chat</h1>
            <p className="text-sm text-muted-foreground">
              Ask questions about your Slack conversations
            </p>
          </div>
        </div>

        {chatMessages.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearChat}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Chat
          </Button>
        )}
      </header>

      {/* Messages Area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-6">
          {chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mt-4 text-lg font-medium text-foreground">
                How can I help you today?
              </h2>
              <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
                Ask me anything about your Slack channels. I can summarize
                discussions, find action items, identify decisions, and more.
              </p>

              {/* Suggested Questions */}
              <div className="mt-8 w-full max-w-2xl">
                <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Try asking
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {suggestedQuestions.map((question, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50"
                      onClick={() => handleSend(question)}
                    >
                      <CardContent className="p-3">
                        <p className="text-sm text-muted-foreground">
                          {question}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {chatMessages.map((message) => (
                <ChatMessageBubble
                  key={message.id}
                  message={message}
                  user={user}
                />
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Input
            ref={inputRef}
            placeholder="Ask about your Slack conversations..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={() => handleSend()} disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          AI responses are based on your Slack channel data
        </p>
      </div>
    </div>
  );
}

function ChatMessageBubble({
  message,
  user,
}: {
  message: ChatMessage;
  user: { name: string; avatar?: string } | null;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {isUser ? (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
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
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={`mt-1 text-xs ${
            isUser ? "text-primary-foreground/70" : "text-muted-foreground/70"
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

function generateMockResponse(query: string): string {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes("engineering")) {
    return `Based on the #engineering channel discussions this week:

**Main Topics:**
1. **v2.0 Release Preparation** - The team has been focused on finalizing the release candidate. QA testing is 85% complete with 3 critical bugs remaining.

2. **Infrastructure Updates** - Migration to the new Kubernetes cluster is scheduled for this weekend. Downtime expected: 2-4 hours.

3. **Code Review Process** - New guidelines were proposed to speed up PR reviews. Team voted to implement mandatory 24-hour SLA for initial review.

**Key Decisions:**
- Adopted Vitest as the new testing framework
- Approved the RFC for the new API versioning strategy
- Set deployment window: Saturdays 2-6 AM

Would you like me to create reminders for any of these items?`;
  }

  if (lowerQuery.includes("product")) {
    return `Here's a summary of action items from #product discussions:

**Open Action Items:**
1. @sarah - Complete competitive analysis by Friday
2. @mike - Schedule customer interviews for next week
3. @team - Review and comment on Q2 roadmap proposal
4. @jessica - Update pricing documentation

**Recently Completed:**
- User research synthesis document (completed by @alex)
- Sprint planning for v2.1 features
- Stakeholder presentation deck

**Upcoming Deadlines:**
- Feb 15: Q2 roadmap finalization
- Feb 18: Customer feedback review session
- Feb 20: Feature prioritization meeting

Do you want me to dive deeper into any of these items?`;
  }

  if (lowerQuery.includes("deadline") || lowerQuery.includes("general")) {
    return `Here are the upcoming deadlines mentioned in #general:

**This Week:**
- **Friday, Feb 14**: Q1 all-hands presentation slides due
- **Friday, Feb 14**: Expense reports deadline

**Next Week:**
- **Monday, Feb 17**: Office renovation Phase 2 begins
- **Wednesday, Feb 19**: Benefits enrollment deadline
- **Friday, Feb 21**: Performance review self-assessments due

**End of Month:**
- **Feb 28**: Q1 planning finalizations
- **Feb 28**: Team budget proposals

Would you like me to set reminders for any of these deadlines?`;
  }

  if (lowerQuery.includes("design")) {
    return `Here's what was decided in #design yesterday:

**Decisions Made:**
1. **Mobile Navigation** - Approved the bottom navigation pattern for the mobile app. Will proceed with implementation next sprint.

2. **Color Palette Update** - New brand colors were finalized:
   - Primary: #2EB67D (green)
   - Secondary: #36C5F0 (blue)
   - Accent: #E01E5A (red)

3. **Component Library** - Agreed to migrate from custom components to shadcn/ui for better consistency.

**Open Discussions:**
- Dashboard layout options (voting ends Friday)
- Icon style preferences (outline vs. filled)

**Next Steps:**
- Update Figma design system by Monday
- Schedule design review for new onboarding flow

Is there anything specific you'd like to know more about?`;
  }

  // Default response
  return `I've analyzed your Slack channels and here's what I found:

Based on recent discussions across your workspace, the main themes include:
- Project updates and milestone tracking
- Team coordination and resource allocation  
- Technical discussions and decision-making
- Upcoming events and deadlines

To give you more specific insights, try asking about:
- A specific channel (e.g., "What's happening in #engineering?")
- Action items or tasks
- Decisions made
- Upcoming deadlines
- Specific topics or keywords

How can I help you further?`;
}
