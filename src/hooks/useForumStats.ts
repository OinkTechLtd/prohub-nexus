import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ForumStats {
  totalUsers: number;
  totalTopics: number;
  totalPosts: number;
  totalResources: number;
  totalVideos: number;
  onlineUsers: number;
  recentActivity: Array<{
    user: string;
    action: string;
    target: string;
    timestamp: string;
  }>;
}

export const useForumStats = () => {
  const [stats, setStats] = useState<ForumStats>({
    totalUsers: 0,
    totalTopics: 0,
    totalPosts: 0,
    totalResources: 0,
    totalVideos: 0,
    onlineUsers: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      // Get counts
      const [
        { count: usersCount },
        { count: topicsCount },
        { count: postsCount },
        { count: resourcesCount },
        { count: videosCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("topics").select("*", { count: "exact", head: true }).eq("is_hidden", false),
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("is_hidden", false),
        supabase.from("resources").select("*", { count: "exact", head: true }).eq("is_hidden", false),
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("is_hidden", false),
      ]);

      setStats((prev) => ({
        ...prev,
        totalUsers: usersCount || 0,
        totalTopics: topicsCount || 0,
        totalPosts: postsCount || 0,
        totalResources: resourcesCount || 0,
        totalVideos: videosCount || 0,
        onlineUsers: 0, // TODO: track online users via presence
      }));
    } catch (error) {
      console.error("Error loading forum stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading };
};
