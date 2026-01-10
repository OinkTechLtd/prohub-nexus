import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Public VAPID key (generate on server or use static for demo)
const VAPID_PUBLIC_KEY = "BAjGLqRf4x4bFxGKx4cZLq7YvBP3ZqJL9q3P3a3V3aJP3a3V3aJP3a3V3aJP3a3V3aJP3a3V3aJP3a3V3aJP3a3V3aJP3a";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(userId: string | undefined) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!userId || !isSupported) return;
    
    // Check if already subscribed
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
      });
    });
  }, [userId, isSupported]);

  const subscribe = useCallback(async () => {
    if (!userId || !isSupported) return false;

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      const registration = await navigator.serviceWorker.ready;
      
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const sub = subscription.toJSON();
      
      // Save to database
      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: userId,
        endpoint: sub.endpoint!,
        p256dh: sub.keys!.p256dh,
        auth: sub.keys!.auth,
      }, { onConflict: "user_id,endpoint" });

      if (error) throw error;
      
      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("Push subscription failed:", err);
      return false;
    }
  }, [userId, isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!userId) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await supabase.from("push_subscriptions")
          .delete()
          .eq("user_id", userId)
          .eq("endpoint", subscription.endpoint);
      }
      
      setIsSubscribed(false);
    } catch (err) {
      console.error("Unsubscribe failed:", err);
    }
  }, [userId]);

  return { isSupported, isSubscribed, permission, subscribe, unsubscribe };
}
