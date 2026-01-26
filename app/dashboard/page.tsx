"use client";

import { useAppStore } from "@/lib/store";
import { ChannelsView } from "@/components/dashboard/channels-view";
import { SummariesView } from "@/components/dashboard/summaries-view";
import { RemindersView } from "@/components/dashboard/reminders-view";
import { ChatView } from "@/components/dashboard/chat-view";

export default function DashboardPage() {
  const { activeView } = useAppStore();

  return (
    <div className="flex h-screen flex-col">
      {activeView === "channels" && <ChannelsView />}
      {activeView === "summaries" && <SummariesView />}
      {activeView === "reminders" && <RemindersView />}
      {activeView === "chat" && <ChatView />}
    </div>
  );
}
