"use client";

import { create } from "zustand";
import type { User, Channel, Summary, Reminder, ChatMessage } from "./types";

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;

  // Channels
  channels: Channel[];
  setChannels: (channels: Channel[]) => void;
  selectedChannel: Channel | null;
  setSelectedChannel: (channel: Channel | null) => void;

  // Summaries
  summaries: Summary[];
  addSummary: (summary: Summary) => void;
  setSummaries: (summaries: Summary[]) => void;

  // Reminders
  reminders: Reminder[];
  addReminder: (reminder: Reminder) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  setReminders: (reminders: Reminder[]) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  activeView: "channels" | "summaries" | "reminders" | "chat";
  setActiveView: (view: "channels" | "summaries" | "reminders" | "chat") => void;
}

export const useAppStore = create<AppState>((set) => ({
  // User state
  user: null,
  setUser: (user) => set({ user }),

  // Channels
  channels: [],
  setChannels: (channels) => set({ channels }),
  selectedChannel: null,
  setSelectedChannel: (selectedChannel) => set({ selectedChannel }),

  // Summaries
  summaries: [],
  addSummary: (summary) =>
    set((state) => ({ summaries: [summary, ...state.summaries] })),
  setSummaries: (summaries) => set({ summaries }),

  // Reminders
  reminders: [],
  addReminder: (reminder) =>
    set((state) => ({ reminders: [...state.reminders, reminder] })),
  updateReminder: (id, updates) =>
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),
  deleteReminder: (id) =>
    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== id),
    })),
  setReminders: (reminders) => set({ reminders }),

  // Chat
  chatMessages: [],
  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  clearChat: () => set({ chatMessages: [] }),

  // UI State
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  activeView: "channels",
  setActiveView: (activeView) => set({ activeView }),
}));
