"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { ChannelSelection } from "@/components/dashboard/channel-selection"
import { ChannelChat } from "@/components/dashboard/channel-chat"

export default function DashboardPage() {
  const router = useRouter()
  const { user, selectedChannel, setUser, logout } = useAppStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          if (data.authenticated) {
            setUser({
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              avatar: data.user.image,
              teamName: data.user.teamName,
            })
            setIsChecking(false)
            return
          }
        }
        // Not authenticated
        logout()
        router.push("/")
      } catch {
        logout()
        router.push("/")
      }
    }

    checkAuth()
  }, [router, setUser, logout])

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Show channel chat if a channel is selected, otherwise show channel selection
  if (selectedChannel) {
    return <ChannelChat />
  }

  return <ChannelSelection />
}
