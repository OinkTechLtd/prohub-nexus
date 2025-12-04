import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_ID_KEY = "prohub_session_id";

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

export interface OnlineCounts {
  users: number;
  guests: number;
  robots: number;
  total: number;
}

export interface OnlineUser {
  user_type: string;
  username?: string;
  current_page?: string;
}

export const usePresenceTracking = () => {
  const [counts, setCounts] = useState<OnlineCounts>({
    users: 0,
    guests: 0,
    robots: 0,
    total: 0,
  });
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  const trackPresence = useCallback(async () => {
    try {
      const sessionId = getOrCreateSessionId();
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("track-presence", {
        body: {
          session_id: sessionId,
          user_id: session?.user?.id,
          current_page: window.location.pathname,
          user_agent: navigator.userAgent,
        },
      });

      if (response.data?.counts) {
        setCounts(response.data.counts);
      }
      if (response.data?.onlineUsers) {
        setOnlineUsers(response.data.onlineUsers);
      }
    } catch (error) {
      console.error("Error tracking presence:", error);
    }
  }, []);

  useEffect(() => {
    // Track immediately on mount
    trackPresence();

    // Track every 30 seconds
    const interval = setInterval(trackPresence, 30000);

    // Track on page change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        trackPresence();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [trackPresence]);

  return { counts, onlineUsers, trackPresence };
};
