"use client";

import React from "react"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SlackIcon } from "@/components/icons/slack-icon";
import { useAppStore } from "@/lib/store";
import { MessageSquare, Bell, Sparkles, Zap } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSlackLogin = async () => {
    setIsLoading(true);
    
    // Simulate Slack OAuth flow
    // In production, this would redirect to Slack's OAuth endpoint
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Mock user data after OAuth
    setUser({
      id: "user_123",
      email: "demo@example.com",
      name: "Demo User",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
      slackAccessToken: "xoxb-mock-token",
    });
    
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">SlackSum</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-5xl">
          {/* Hero Section */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
              Summarize Slack channels
              <br />
              <span className="text-primary">with AI</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground text-pretty">
              Connect your Slack workspace to get AI-powered summaries of your channels,
              set smart reminders, and never miss important discussions.
            </p>
          </div>

          {/* Login Card */}
          <div className="mx-auto max-w-md">
            <Card className="border-border bg-card">
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-card-foreground">Get Started</CardTitle>
                <CardDescription>
                  Connect your Slack workspace to begin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleSlackLogin}
                  disabled={isLoading}
                  className="w-full bg-[#4A154B] hover:bg-[#3a1139] text-white"
                  size="lg"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <SlackIcon className="h-5 w-5" />
                      Sign in with Slack
                    </span>
                  )}
                </Button>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title="Channel Summaries"
              description="Get AI-generated summaries of your Slack channels in seconds"
            />
            <FeatureCard
              icon={<Bell className="h-6 w-6" />}
              title="Smart Reminders"
              description="Set reminders based on important discussions and action items"
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Real-time Chat"
              description="Interact with AI to ask questions about your Slack conversations"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4">
        <p className="text-center text-sm text-muted-foreground">
          Built with AI-powered summarization technology
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-border bg-card/50">
      <CardContent className="pt-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="mb-2 font-semibold text-card-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
