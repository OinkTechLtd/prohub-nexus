import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Quest {
  id: string;
  name: string;
  description: string;
  quest_type: string;
  action_type: string;
  target_value: number;
  reward_points: number;
  icon: string;
  is_active: boolean;
}

export interface QuestProgress {
  id: string;
  user_id: string;
  quest_id: string;
  current_value: number;
  is_completed: boolean;
  completed_at: string | null;
  period_start: string;
}

export interface QuestWithProgress extends Quest {
  current_value: number;
  is_completed: boolean;
  progress_percent: number;
}

const getPeriodStart = (type: string): string => {
  const now = new Date();
  if (type === "daily") {
    return now.toISOString().split("T")[0];
  }
  // weekly - start of week (Monday)
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
};

export const useDailyQuests = (userId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quests = [], isLoading: isLoadingQuests } = useQuery({
    queryKey: ["daily-quests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_quests")
        .select("*")
        .eq("is_active", true)
        .order("quest_type")
        .order("reward_points", { ascending: true });
      if (error) throw error;
      return data as Quest[];
    },
  });

  const { data: progress = [], isLoading: isLoadingProgress } = useQuery({
    queryKey: ["quest-progress", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_quest_progress")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return data as QuestProgress[];
    },
    enabled: !!userId,
  });

  const updateProgress = useMutation({
    mutationFn: async ({ questId, actionType }: { questId: string; actionType: string }) => {
      if (!userId) throw new Error("Not authenticated");

      const quest = quests.find((q) => q.id === questId);
      if (!quest) throw new Error("Quest not found");

      const periodStart = getPeriodStart(quest.quest_type);

      // Upsert progress
      const existing = progress.find(
        (p) => p.quest_id === questId && p.period_start === periodStart
      );

      if (existing) {
        if (existing.is_completed) return;
        const newValue = existing.current_value + 1;
        const completed = newValue >= quest.target_value;

        const { error } = await supabase
          .from("user_quest_progress")
          .update({
            current_value: newValue,
            is_completed: completed,
            completed_at: completed ? new Date().toISOString() : null,
          })
          .eq("id", existing.id);
        if (error) throw error;

        if (completed) {
          toast({
            title: "🎉 Задание выполнено!",
            description: `${quest.name} — +${quest.reward_points} очков`,
          });
        }
      } else {
        const newValue = 1;
        const completed = newValue >= quest.target_value;

        const { error } = await supabase.from("user_quest_progress").insert({
          user_id: userId,
          quest_id: questId,
          current_value: newValue,
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
          period_start: periodStart,
        });
        if (error) throw error;

        if (completed) {
          toast({
            title: "🎉 Задание выполнено!",
            description: `${quest.name} — +${quest.reward_points} очков`,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quest-progress"] });
    },
  });

  // Merge quests with progress
  const questsWithProgress: QuestWithProgress[] = quests.map((quest) => {
    const periodStart = getPeriodStart(quest.quest_type);
    const p = progress.find(
      (pr) => pr.quest_id === quest.id && pr.period_start === periodStart
    );
    const currentValue = p?.current_value || 0;
    return {
      ...quest,
      current_value: currentValue,
      is_completed: p?.is_completed || false,
      progress_percent: Math.min((currentValue / quest.target_value) * 100, 100),
    };
  });

  const dailyQuests = questsWithProgress.filter((q) => q.quest_type === "daily");
  const weeklyQuests = questsWithProgress.filter((q) => q.quest_type === "weekly");
  const completedToday = dailyQuests.filter((q) => q.is_completed).length;
  const completedWeekly = weeklyQuests.filter((q) => q.is_completed).length;
  const totalRewardsEarned = questsWithProgress
    .filter((q) => q.is_completed)
    .reduce((sum, q) => sum + q.reward_points, 0);

  return {
    quests: questsWithProgress,
    dailyQuests,
    weeklyQuests,
    completedToday,
    completedWeekly,
    totalRewardsEarned,
    isLoading: isLoadingQuests || isLoadingProgress,
    updateProgress: updateProgress.mutate,
  };
};
