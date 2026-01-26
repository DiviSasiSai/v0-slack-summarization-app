"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { ChannelSelection } from "@/components/dashboard/channel-selection";
import { ChannelChat } from "@/components/dashboard/channel-chat";

export default function DashboardPage() {
  const router = useRouter();
  const { user, selectedChannel } = useAppStore();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  // Show channel chat if a channel is selected, otherwise show channel selection
  if (selectedChannel) {
    return <ChannelChat />;
  }

  return <ChannelSelection />;
}
