"use client"

import { useEffect, useState } from "react"
import { usePushNotifications } from "@/hooks/use-push-notifications"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, X } from "lucide-react"

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    isLoading,
  } = usePushNotifications()

  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Register service worker on mount
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error)
    }

    // Show prompt if supported but not subscribed
    const hasSeenPrompt = localStorage.getItem("notification-prompt-dismissed")
    if (isSupported && permission === "default" && !isSubscribed && !hasSeenPrompt) {
      // Delay showing the prompt
      const timer = setTimeout(() => setShowPrompt(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [isSupported, permission, isSubscribed])

  const handleEnable = async () => {
    await subscribe()
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem("notification-prompt-dismissed", "true")
  }

  return (
    <>
      {children}
      
      {/* Notification Permission Prompt */}
      {showPrompt && !dismissed && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
          <Card className="w-80 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Bell className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base">Enable Notifications</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-3">
                Get notified about important messages and action items from your Slack channels.
              </CardDescription>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleEnable}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Enabling..." : "Enable"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDismiss}
                >
                  Not now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
