import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Star, Award, Crown, Gem, Flame } from "lucide-react";

interface UserLevelBadgeProps {
  postCount: number;
  reputation: number;
  compact?: boolean;
}

const LEVELS = [
  { name: "Новичок", min: 0, max: 30, icon: Star, color: "bg-muted text-muted-foreground" },
  { name: "Участник", min: 30, max: 100, icon: Award, color: "bg-emerald-500/20 text-emerald-500" },
  { name: "Профессионал", min: 100, max: 300, icon: Crown, color: "bg-blue-500/20 text-blue-500" },
  { name: "Эксперт", min: 300, max: 700, icon: Gem, color: "bg-purple-500/20 text-purple-500" },
  { name: "Легенда", min: 700, max: Infinity, icon: Flame, color: "bg-amber-500/20 text-amber-500" },
];

export function getUserLevel(score: number) {
  return LEVELS.find((l) => score >= l.min && score < l.max) || LEVELS[0];
}

export default function UserLevelBadge({ postCount, reputation, compact }: UserLevelBadgeProps) {
  const score = postCount + Math.floor(reputation / 5);
  const level = getUserLevel(score);
  const Icon = level.icon;

  const progress = level.max === Infinity
    ? 100
    : Math.min(100, ((score - level.min) / (level.max - level.min)) * 100);

  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];

  if (compact) {
    return (
      <Badge variant="outline" className={`gap-1 ${level.color} border-0`}>
        <Icon className="h-3 w-3" />
        {level.name}
      </Badge>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={`gap-1 ${level.color} border-0`}>
          <Icon className="h-3.5 w-3.5" />
          {level.name}
        </Badge>
        {nextLevel && (
          <span className="text-xs text-muted-foreground">
            {score}/{level.max} → {nextLevel.name}
          </span>
        )}
      </div>
      <Progress value={progress} className="h-1.5" />
    </div>
  );
}
