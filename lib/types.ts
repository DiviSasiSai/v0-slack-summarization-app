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
}

export interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: string;
  channelId: string;
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
  timeRange: string;
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
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
