"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { sendUserMessage } from "@/lib/api";
import type { Summary } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Hash,
  Sparkles,
  Clock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  FileText,
  RefreshCw,
  Bell,
  Lock,
} from "lucide-react";

export function SummariesView() {
  const {
    selectedChannel,
    channels,
    setSelectedChannel,
    summaries,
    addSummary,
    user,
    setActiveView,
  } = useAppStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [timeRange, setTimeRange] = useState("24h");

  const currentSummaries = summaries.filter(
    (s) => s.channelId === selectedChannel?.id
  );

  const handleGenerateSummary = async () => {
    if (!selectedChannel || !user) return;

    setIsGenerating(true);

    try {
      // Call the AI agent API
      await sendUserMessage({
        device_id: `web_${user.id}`,
        email: user.email,
        message: `Summarize the last ${timeRange === "24h" ? "24 hours" : timeRange === "7d" ? "7 days" : "30 days"} of messages from the #${selectedChannel.name} channel`,
      });

      // Simulate AI response (in production, this would come from the API)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockSummary: Summary = {
        id: `summary_${Date.now()}`,
        channelId: selectedChannel.id,
        channelName: selectedChannel.name,
        content: generateMockSummaryContent(selectedChannel.name),
        keyPoints: generateMockKeyPoints(selectedChannel.name),
        actionItems: generateMockActionItems(selectedChannel.name),
        createdAt: new Date().toISOString(),
        messageCount: Math.floor(Math.random() * 200) + 50,
        timeRange: timeRange === "24h" ? "Last 24 hours" : timeRange === "7d" ? "Last 7 days" : "Last 30 days",
      };

      addSummary(mockSummary);
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateReminder = () => {
    setActiveView("reminders");
  };

  if (!selectedChannel) {
    return (
      <div className="flex flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Summaries</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered summaries of your Slack channels
            </p>
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-medium text-foreground">
            No channel selected
          </h2>
          <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
            Select a channel from the sidebar or the channels view to generate an
            AI summary
          </p>

          <div className="mt-6">
            <Select
              value={selectedChannel?.id || ""}
              onValueChange={(value) => {
                const channel = channels.find((c) => c.id === value);
                if (channel) setSelectedChannel(channel);
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a channel" />
              </SelectTrigger>
              <SelectContent>
                {channels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    <span className="flex items-center gap-2">
                      {channel.type === "private" ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <Hash className="h-3 w-3" />
                      )}
                      {channel.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            {selectedChannel.type === "private" ? (
              <Lock className="h-5 w-5 text-primary" />
            ) : (
              <Hash className="h-5 w-5 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              #{selectedChannel.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {currentSummaries.length} summaries generated
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleGenerateSummary} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Summary
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {currentSummaries.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-card-foreground">
                  No summaries yet
                </h3>
                <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
                  Click "Generate Summary" to create an AI-powered summary of the
                  recent conversations in this channel.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {currentSummaries.map((summary) => (
                <SummaryCard
                  key={summary.id}
                  summary={summary}
                  onCreateReminder={handleCreateReminder}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function SummaryCard({
  summary,
  onCreateReminder,
}: {
  summary: Summary;
  onCreateReminder: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-4 w-4 text-primary" />
              Summary
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {summary.timeRange}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {summary.messageCount} messages analyzed
              </span>
            </CardDescription>
          </div>
          <Badge variant="outline">
            {new Date(summary.createdAt).toLocaleDateString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="key-points">Key Points</TabsTrigger>
            <TabsTrigger value="action-items">Action Items</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-0">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {summary.content}
            </p>
          </TabsContent>

          <TabsContent value="key-points" className="mt-0">
            <ul className="space-y-2">
              {summary.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="action-items" className="mt-0">
            <ul className="space-y-2">
              {summary.actionItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 bg-transparent"
              onClick={onCreateReminder}
            >
              <Bell className="mr-2 h-4 w-4" />
              Create Reminder
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Mock data generators
function generateMockSummaryContent(channelName: string): string {
  const summaries: Record<string, string> = {
    general:
      "The team discussed upcoming company events and shared general announcements. Key topics included the Q1 all-hands meeting scheduled for next week, updates on the office renovation, and reminders about the new expense reporting system. Several team members shared positive feedback about the recent team-building event.",
    engineering:
      "Technical discussions focused on the upcoming v2.0 release. The team reviewed pull requests for the new authentication system and discussed performance optimization strategies. There was significant debate about adopting a new testing framework, with most members favoring the switch to Vitest. Deployment schedules were coordinated for the weekend maintenance window.",
    design:
      "The design team presented new mockups for the mobile app redesign. Feedback sessions were conducted with stakeholders, resulting in several iterations on the navigation flow. Brand guidelines were updated to include new color palettes and typography standards. The team also discussed accessibility improvements for the dashboard.",
    product:
      "Product roadmap discussions dominated the channel. The team prioritized features for Q2 based on customer feedback and market analysis. Sprint planning for the next two weeks was completed, with a focus on user onboarding improvements. Several customer interviews were scheduled to gather insights for the enterprise tier.",
    marketing:
      "Campaign performance reviews showed strong engagement metrics for the latest email series. The team discussed social media strategy adjustments and content calendar updates. New blog posts were reviewed and scheduled for publication. Partnership opportunities with industry influencers were explored.",
  };

  return (
    summaries[channelName] ||
    "The channel had active discussions covering various topics relevant to the team. Key themes included project updates, team coordination, and upcoming deadlines. Several action items were identified and assigned to team members for follow-up."
  );
}

function generateMockKeyPoints(channelName: string): string[] {
  const keyPoints: Record<string, string[]> = {
    general: [
      "Q1 all-hands meeting scheduled for next Friday at 2 PM",
      "Office renovation Phase 2 begins March 15th",
      "New expense reporting system goes live Monday",
      "Team building event received positive feedback (4.5/5 rating)",
    ],
    engineering: [
      "v2.0 release candidate ready for QA testing",
      "New authentication system passed security review",
      "Team agreed to migrate from Jest to Vitest",
      "Weekend deployment window: Saturday 2-6 AM",
    ],
    design: [
      "Mobile app redesign mockups approved by stakeholders",
      "Navigation flow requires one more iteration",
      "Brand guidelines v3.0 published to design system",
      "Accessibility audit scheduled for end of month",
    ],
    product: [
      "Q2 roadmap finalized with 3 major feature releases",
      "User onboarding flow is top priority for next sprint",
      "5 customer interviews scheduled this week",
      "Enterprise tier pricing under review",
    ],
    marketing: [
      "Email campaign achieved 32% open rate",
      "Social media engagement up 15% MoM",
      "3 new blog posts scheduled for publication",
      "Partnership discussions with 2 key influencers",
    ],
  };

  return (
    keyPoints[channelName] || [
      "Project timeline discussed and updated",
      "Resource allocation reviewed",
      "Key deliverables identified",
      "Follow-up meeting scheduled",
    ]
  );
}

function generateMockActionItems(channelName: string): string[] {
  const actionItems: Record<string, string[]> = {
    general: [
      "Send calendar invites for all-hands meeting",
      "Update desk assignments before renovation",
      "Complete expense training by Friday",
    ],
    engineering: [
      "Complete QA testing by Thursday",
      "Update deployment runbook",
      "Set up Vitest in main repository",
    ],
    design: [
      "Finalize navigation flow by Wednesday",
      "Update Figma components with new brand colors",
      "Schedule accessibility review meeting",
    ],
    product: [
      "Send interview invitations to customers",
      "Prepare sprint backlog for planning",
      "Draft pricing proposal for enterprise tier",
    ],
    marketing: [
      "Prepare performance report for leadership",
      "Review and schedule blog content",
      "Draft partnership outreach emails",
    ],
  };

  return (
    actionItems[channelName] || [
      "Follow up on pending items",
      "Update project documentation",
      "Schedule next sync meeting",
    ]
  );
}
