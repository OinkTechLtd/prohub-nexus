import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useInterestTracking = (userId: string | undefined) => {
  const trackInterest = async (interest: string) => {
    if (!userId) return;

    try {
      // Check if interest already exists
      const { data: existing } = await supabase
        .from("user_interests")
        .select("score")
        .eq("user_id", userId)
        .eq("interest", interest)
        .single();

      if (existing) {
        // Increment score
        await supabase
          .from("user_interests")
          .update({ score: parseFloat(existing.score.toString()) + 1 })
          .eq("user_id", userId)
          .eq("interest", interest);
      } else {
        // Create new interest
        await supabase.from("user_interests").insert({
          user_id: userId,
          interest,
          score: 1,
        });
      }
    } catch (error) {
      console.error("Error tracking interest:", error);
    }
  };

  return { trackInterest };
};
