"use client"

import { useState, useEffect, useCallback } from "react"

function generateDeviceId(): string {
  // Check if we already have a device ID stored
  const stored = localStorage.getItem("device_id")
  if (stored) return stored

  // Generate a new unique device ID
  const newId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  localStorage.setItem("device_id", newId)
  return newId
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deviceId, setDeviceId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if push notifications are supported
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window

    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
      setDeviceId(generateDeviceId())

      // Check if already subscribed
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch {
      setIsSubscribed(false)
    }
  }

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Push notifications are not supported in this browser")
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === "granted") {
        return true
      } else if (result === "denied") {
        setError("Notification permission was denied")
        return false
      }

      return false
    } catch (err) {
      setError("Failed to request notification permission")
      console.error("Permission request error:", err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Push notifications are not supported")
      return false
    }

    if (permission !== "granted") {
      const granted = await requestPermission()
      if (!granted) return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready

      // Get VAPID public key
      const vapidResponse = await fetch("/api/push/vapid-key")
      if (!vapidResponse.ok) {
        throw new Error("Failed to get VAPID key")
      }
      const { publicKey } = await vapidResponse.json()

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      // Send subscription to server
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          deviceId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save subscription")
      }

      setIsSubscribed(true)
      return true
    } catch (err) {
      console.error("Subscription error:", err)
      setError("Failed to subscribe to notifications")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, permission, deviceId, requestPermission])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
      }

      // Remove from server
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceId }),
      })

      setIsSubscribed(false)
      return true
    } catch (err) {
      console.error("Unsubscribe error:", err)
      setError("Failed to unsubscribe")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [deviceId])

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    deviceId,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
  }
}
