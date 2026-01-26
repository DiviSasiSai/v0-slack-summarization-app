export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  slackAccessToken?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: "public" | "private";
  memberCount?: number;
  lastActivity?: string;
  unreadCount?: number;
}

export interface SlackMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  channelId: string;
  channelName: string;
  hasImage?: boolean;
  imageUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  channelId?: string;
  channelName?: string;
  dueDate: string;
  dueTime: string;
  isCompleted: boolean;
  isRead: boolean;
  createdAt: string;
  source: "auto" | "manual";
}

export interface Summary {
  id: string;
  channelId: string;
  channelName: string;
  content: string;
  keyPoints: string[];
  actionItems: string[];
  createdAt: string;
  messageCount: number;
}
