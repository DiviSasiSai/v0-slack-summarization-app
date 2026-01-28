"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Channel, ChatMessage } from "./types"

interface AppState {
  // User state
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void

  // Channels
  channels: Channel[]
  setChannels: (channels: Channel[]) => void
  selectedChannel: Channel | null
  setSelectedChannel: (channel: Channel | null) => void

  // Chat messages per channel (keyed by channelId)
  chatMessagesByChannel: Record<string, ChatMessage[]>
  addChatMessage: (channelId: string, message: ChatMessage) => void
  getChatMessages: (channelId: string) => ChatMessage[]
  clearChannelChat: (channelId: string) => void

  // Device ID for push notifications
  deviceId: string | null
  setDeviceId: (id: string) => void

  // UI State
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User state
      user: null,
      setUser: (user) => set({ user }),
      logout: () =>
        set({
          user: null,
          selectedChannel: null,
          channels: [],
          chatMessagesByChannel: {},
        }),

      // Channels
      channels: [],
      setChannels: (channels) => set({ channels }),
      selectedChannel: null,
      setSelectedChannel: (selectedChannel) => set({ selectedChannel }),

      // Chat messages per channel
      chatMessagesByChannel: {},
      addChatMessage: (channelId, message) =>
        set((state) => ({
          chatMessagesByChannel: {
            ...state.chatMessagesByChannel,
            [channelId]: [
              ...(state.chatMessagesByChannel[channelId] || []),
              message,
            ],
          },
        })),
      getChatMessages: (channelId) => {
        return get().chatMessagesByChannel[channelId] || []
      },
      clearChannelChat: (channelId) =>
        set((state) => ({
          chatMessagesByChannel: {
            ...state.chatMessagesByChannel,
            [channelId]: [],
          },
        })),

      // Device ID
      deviceId: null,
      setDeviceId: (deviceId) => set({ deviceId }),

      // UI State
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "slacksum-storage",
      partialize: (state) => ({
        user: state.user,
        selectedChannel: state.selectedChannel,
        chatMessagesByChannel: state.chatMessagesByChannel,
        deviceId: state.deviceId,
      }),
    }
  )
)
