import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserReputation {
  reputation_points: number;
  likes_received: number;
  likes_given: number;
  helpful_posts: number;
  helpful_resources: number;
  helpful_videos: number;
}

export const useReputation = (userId?: string) => {
  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadReputation();
    }
  }, [userId]);

  const loadReputation = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from("user_reputation")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading reputation:", error);
      }

      setReputation(data || {
        reputation_points: 0,
        likes_received: 0,
        likes_given: 0,
        helpful_posts: 0,
        helpful_resources: 0,
        helpful_videos: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const likeContent = useCallback(async (contentType: string, contentId: string, authorId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from("content_likes")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("content_type", contentType)
        .eq("content_id", contentId)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from("content_likes")
          .delete()
          .eq("id", existingLike.id);

        return false;
      } else {
        // Like
        await supabase
          .from("content_likes")
          .insert({
            user_id: session.user.id,
            content_type: contentType,
            content_id: contentId,
          });

        return true;
      }
    } catch (error) {
      console.error("Error liking content:", error);
      return null;
    }
  }, []);

  const checkIfLiked = useCallback(async (contentType: string, contentId: string): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const { data } = await supabase
      .from("content_likes")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .single();

    return !!data;
  }, []);

  const getLikesCount = useCallback(async (contentType: string, contentId: string): Promise<number> => {
    const { count } = await supabase
      .from("content_likes")
      .select("*", { count: "exact", head: true })
      .eq("content_type", contentType)
      .eq("content_id", contentId);

    return count || 0;
  }, []);

  return {
    reputation,
    loading,
    likeContent,
    checkIfLiked,
    getLikesCount,
    refresh: loadReputation,
  };
};
