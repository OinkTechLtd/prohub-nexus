import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  is_new_day: boolean;
  streak_broken?: boolean;
  milestone_bonus?: number;
}

export const useStreak = (userId?: string) => {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      updateStreak();
    }
  }, [userId]);

  const updateStreak = async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase.rpc("update_daily_streak", {
        _user_id: userId,
      });
      if (error) throw error;

      const result = data as unknown as StreakData;
      setStreak(result);

      if (result.milestone_bonus && result.milestone_bonus > 0) {
        toast({
          title: `🏆 Награда за серию ${result.current_streak} дней!`,
          description: `Вы получили +${result.milestone_bonus} очков репутации!`,
        });
      } else if (result.is_new_day && result.current_streak > 1) {
        toast({
          title: `🔥 Серия ${result.current_streak} дней!`,
          description: `Вы заходите на форум ${result.current_streak} дней подряд!`,
        });
      }

      if (result.streak_broken) {
        toast({
          title: "💔 Серия прервана",
          description: "Вы пропустили день. Начинаем заново!",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Streak error:", error);
    } finally {
      setLoading(false);
    }
  };

  return { streak, loading };
};
