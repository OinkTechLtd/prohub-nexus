import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ThumbsUp, ThumbsDown, Star, TrendingUp, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ReputationDisplayProps {
  userId: string;
  isOwnProfile: boolean;
  currentUserId?: string;
}

interface ReputationData {
  reputation_points: number;
  likes_received: number;
  likes_given: number;
  helpful_posts: number;
  helpful_resources: number;
  helpful_videos: number;
}

const ReputationDisplay = ({ userId, isOwnProfile, currentUserId }: ReputationDisplayProps) => {
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [giving, setGiving] = useState(false);
  const [hasGivenPositive, setHasGivenPositive] = useState(false);
  const [hasGivenNegative, setHasGivenNegative] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadReputation();
    if (currentUserId && userId !== currentUserId) {
      checkIfGivenReputation();
    }
  }, [userId, currentUserId]);

  const loadReputation = async () => {
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

  const checkIfGivenReputation = async () => {
    if (!currentUserId) return;
    
    // Check if current user has liked any content from this user
    const { data: likes } = await supabase
      .from("content_likes")
      .select("id")
      .eq("user_id", currentUserId)
      .eq("content_type", "profile_positive")
      .eq("content_id", userId)
      .single();

    setHasGivenPositive(!!likes);

    const { data: dislikes } = await supabase
      .from("content_likes")
      .select("id")
      .eq("user_id", currentUserId)
      .eq("content_type", "profile_negative")
      .eq("content_id", userId)
      .single();

    setHasGivenNegative(!!dislikes);
  };

  const giveReputation = async (positive: boolean) => {
    if (!currentUserId || isOwnProfile || giving) return;

    setGiving(true);
    try {
      const contentType = positive ? "profile_positive" : "profile_negative";
      const oppositeType = positive ? "profile_negative" : "profile_positive";
      
      // Check if already given this type
      const { data: existing } = await supabase
        .from("content_likes")
        .select("id")
        .eq("user_id", currentUserId)
        .eq("content_type", contentType)
        .eq("content_id", userId)
        .single();

      if (existing) {
        // Remove existing
        await supabase
          .from("content_likes")
          .delete()
          .eq("id", existing.id);

        // Update reputation
        if (positive) {
          await supabase.rpc("update_reputation_on_unlike", {
            _author_id: userId,
            _liker_id: currentUserId,
          });
          setHasGivenPositive(false);
        } else {
          // For negative, we add back the points
          await supabase
            .from("user_reputation")
            .update({ 
              reputation_points: (reputation?.reputation_points || 0) + 5,
            })
            .eq("user_id", userId);
          setHasGivenNegative(false);
        }

        toast({
          title: "Репутация отменена",
          description: positive ? "Вы убрали +репутацию" : "Вы убрали -репутацию",
        });
      } else {
        // Remove opposite if exists
        const { data: opposite } = await supabase
          .from("content_likes")
          .select("id")
          .eq("user_id", currentUserId)
          .eq("content_type", oppositeType)
          .eq("content_id", userId)
          .single();

        if (opposite) {
          await supabase
            .from("content_likes")
            .delete()
            .eq("id", opposite.id);
          
          if (!positive) {
            setHasGivenPositive(false);
          } else {
            setHasGivenNegative(false);
          }
        }

        // Add new
        await supabase
          .from("content_likes")
          .insert({
            user_id: currentUserId,
            content_type: contentType,
            content_id: userId,
          });

        if (positive) {
          await supabase.rpc("update_reputation_on_like", {
            _author_id: userId,
            _liker_id: currentUserId,
          });
          setHasGivenPositive(true);
          setHasGivenNegative(false);
        } else {
          // Negative reputation
          await supabase
            .from("user_reputation")
            .upsert({ 
              user_id: userId,
              reputation_points: Math.max(0, (reputation?.reputation_points || 0) - 5),
            }, { onConflict: 'user_id' });
          setHasGivenNegative(true);
          setHasGivenPositive(false);
        }

        toast({
          title: positive ? "+Репутация" : "-Репутация",
          description: positive 
            ? "Вы дали пользователю положительную репутацию!" 
            : "Вы дали пользователю отрицательную репутацию",
        });
      }

      loadReputation();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGiving(false);
    }
  };

  const getReputationLevel = (points: number) => {
    if (points >= 1000) return { label: "Легенда", color: "text-yellow-500", level: 10 };
    if (points >= 500) return { label: "Мастер", color: "text-purple-500", level: 8 };
    if (points >= 250) return { label: "Эксперт", color: "text-blue-500", level: 6 };
    if (points >= 100) return { label: "Продвинутый", color: "text-green-500", level: 4 };
    if (points >= 50) return { label: "Активный", color: "text-cyan-500", level: 3 };
    if (points >= 10) return { label: "Участник", color: "text-gray-500", level: 2 };
    return { label: "Новичок", color: "text-muted-foreground", level: 1 };
  };

  const getNextLevelPoints = (points: number) => {
    const levels = [10, 50, 100, 250, 500, 1000];
    for (const level of levels) {
      if (points < level) return level;
    }
    return 1000;
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-20 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const points = reputation?.reputation_points || 0;
  const level = getReputationLevel(points);
  const nextLevel = getNextLevelPoints(points);
  const progress = Math.min((points / nextLevel) * 100, 100);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative"
            >
              <div className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center",
                "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg"
              )}>
                <Star className="h-7 w-7 text-white fill-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full px-1.5 py-0.5 text-xs font-bold border">
                {level.level}
              </div>
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{points}</span>
                <span className="text-sm text-muted-foreground">очков</span>
              </div>
              <div className={cn("text-sm font-medium", level.color)}>
                {level.label}
              </div>
            </div>
          </div>

          {!isOwnProfile && currentUserId && (
            <div className="flex gap-2">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={hasGivenPositive ? "default" : "outline"}
                  size="sm"
                  onClick={() => giveReputation(true)}
                  disabled={giving}
                  className={cn(
                    "gap-1.5",
                    hasGivenPositive && "bg-green-500 hover:bg-green-600"
                  )}
                >
                  <ThumbsUp className={cn("h-4 w-4", hasGivenPositive && "fill-current")} />
                  +Реп
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={hasGivenNegative ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => giveReputation(false)}
                  disabled={giving}
                  className="gap-1.5"
                >
                  <ThumbsDown className={cn("h-4 w-4", hasGivenNegative && "fill-current")} />
                  -Реп
                </Button>
              </motion.div>
            </div>
          )}
        </div>

        {/* Progress to next level */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>До следующего уровня</span>
            <span>{points}/{nextLevel}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-500">
              <ThumbsUp className="h-4 w-4" />
              <span className="font-bold">{reputation?.likes_received || 0}</span>
            </div>
            <div className="text-xs text-muted-foreground">Получено</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-500">
              <TrendingUp className="h-4 w-4" />
              <span className="font-bold">{reputation?.likes_given || 0}</span>
            </div>
            <div className="text-xs text-muted-foreground">Отдано</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-amber-500">
              <Award className="h-4 w-4" />
              <span className="font-bold">
                {(reputation?.helpful_posts || 0) + (reputation?.helpful_resources || 0)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Полезных</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReputationDisplay;
