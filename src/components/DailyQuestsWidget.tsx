import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Clock, Flame, Trophy } from "lucide-react";
import { useDailyQuests, type QuestWithProgress } from "@/hooks/useDailyQuests";

interface DailyQuestsWidgetProps {
  userId?: string;
  className?: string;
}

const QuestItem = ({ quest, index }: { quest: QuestWithProgress; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    className={cn(
      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
      quest.is_completed
        ? "bg-green-500/10 border-green-500/30"
        : "bg-card hover:bg-accent/50"
    )}
  >
    <span className="text-2xl">{quest.icon}</span>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm truncate">{quest.name}</span>
        {quest.is_completed && <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />}
      </div>
      <p className="text-xs text-muted-foreground truncate">{quest.description}</p>
      <div className="flex items-center gap-2 mt-1">
        <Progress value={quest.progress_percent} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {quest.current_value}/{quest.target_value}
        </span>
      </div>
    </div>
    <div className="text-right shrink-0">
      <span className={cn(
        "text-xs font-bold",
        quest.is_completed ? "text-green-500" : "text-primary"
      )}>
        +{quest.reward_points}
      </span>
    </div>
  </motion.div>
);

const DailyQuestsWidget = ({ userId, className }: DailyQuestsWidgetProps) => {
  const {
    dailyQuests,
    weeklyQuests,
    completedToday,
    completedWeekly,
    totalRewardsEarned,
    isLoading,
  } = useDailyQuests(userId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
          <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {completedToday}/{dailyQuests.length}
          </div>
          <div className="text-xs text-muted-foreground">Сегодня</div>
        </Card>
        <Card className="p-3 text-center bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
          <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {completedWeekly}/{weeklyQuests.length}
          </div>
          <div className="text-xs text-muted-foreground">За неделю</div>
        </Card>
        <Card className="p-3 text-center bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/30">
          <Trophy className="h-5 w-5 mx-auto mb-1 text-amber-500" />
          <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
            {totalRewardsEarned}
          </div>
          <div className="text-xs text-muted-foreground">Очков</div>
        </Card>
      </div>

      {/* Daily Quests */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Ежедневные задания
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <AnimatePresence>
            {dailyQuests.map((quest, i) => (
              <QuestItem key={quest.id} quest={quest} index={i} />
            ))}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Weekly Quests */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Еженедельные задания
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <AnimatePresence>
            {weeklyQuests.map((quest, i) => (
              <QuestItem key={quest.id} quest={quest} index={i} />
            ))}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyQuestsWidget;
