"use client";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Hash,
  Bell,
  MessageCircle,
  FileText,
  LogOut,
  Sparkles,
  ChevronDown,
  Lock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

// Mock channels data
const mockChannels = [
  { id: "1", name: "general", type: "public" as const, memberCount: 45 },
  { id: "2", name: "engineering", type: "public" as const, memberCount: 23 },
  { id: "3", name: "design", type: "public" as const, memberCount: 12 },
  { id: "4", name: "product", type: "public" as const, memberCount: 18 },
  { id: "5", name: "marketing", type: "public" as const, memberCount: 15 },
  { id: "6", name: "leadership", type: "private" as const, memberCount: 5 },
  { id: "7", name: "hr-confidential", type: "private" as const, memberCount: 3 },
  { id: "8", name: "random", type: "public" as const, memberCount: 42 },
  { id: "9", name: "announcements", type: "public" as const, memberCount: 50 },
  { id: "10", name: "support", type: "public" as const, memberCount: 28 },
];

const navItems = [
  { id: "channels", label: "Channels", icon: Hash },
  { id: "summaries", label: "Summaries", icon: FileText },
  { id: "reminders", label: "Reminders", icon: Bell },
  { id: "chat", label: "AI Chat", icon: MessageCircle },
] as const;

export function DashboardSidebar() {
  const router = useRouter();
  const {
    user,
    setUser,
    channels,
    setChannels,
    selectedChannel,
    setSelectedChannel,
    activeView,
    setActiveView,
  } = useAppStore();

  // Initialize channels on mount
  if (channels.length === 0) {
    setChannels(mockChannels);
  }

  const handleLogout = () => {
    setUser(null);
    router.push("/");
  };

  const handleChannelSelect = (channel: (typeof mockChannels)[0]) => {
    setSelectedChannel(channel);
    setActiveView("summaries");
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sidebar-foreground">SlackSum</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 border-b border-sidebar-border p-2">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              activeView === item.id &&
                "bg-sidebar-accent text-sidebar-foreground"
            )}
            onClick={() => setActiveView(item.id)}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </nav>

      {/* Channels List */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-xs font-medium uppercase tracking-wide text-sidebar-foreground/50">
            Channels
          </span>
          <span className="text-xs text-sidebar-foreground/40">
            {channels.length}
          </span>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-0.5 px-2 pb-4">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelSelect(channel)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  selectedChannel?.id === channel.id &&
                    "bg-sidebar-accent text-sidebar-foreground"
                )}
              >
                {channel.type === "private" ? (
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Hash className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {user?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-xs text-sidebar-foreground/50">
                  {user?.email}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-sidebar-foreground/50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem disabled>
              <span className="text-muted-foreground">
                Workspace: Demo Workspace
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
