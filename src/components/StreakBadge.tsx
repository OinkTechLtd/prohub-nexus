import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
  className?: string;
}

const StreakBadge = ({ currentStreak, longestStreak, className }: StreakBadgeProps) => {
  if (currentStreak === 0) return null;

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-purple-500";
    if (streak >= 14) return "text-red-500";
    if (streak >= 7) return "text-orange-500";
    if (streak >= 3) return "text-amber-500";
    return "text-muted-foreground";
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border text-sm font-medium",
        className
      )}
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <Flame className={cn("h-4 w-4", getStreakColor(currentStreak))} />
      </motion.div>
      <span className={getStreakColor(currentStreak)}>{currentStreak}</span>
      <span className="text-xs text-muted-foreground">
        дн. | рекорд: {longestStreak}
      </span>
    </motion.div>
  );
};

export default StreakBadge;
