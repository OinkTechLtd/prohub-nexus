import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Medal, Crown, Gem, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge_color: string;
  points: number;
  earned?: boolean;
  earnedAt?: string | null;
  condition_type: string;
  condition_value: number;
}

interface TrophyShowcaseProps {
  achievements: Achievement[];
  totalPoints: number;
  earnedCount: number;
  totalCount: number;
  compact?: boolean;
}

const TrophyShowcase = ({
  achievements,
  totalPoints,
  earnedCount,
  totalCount,
  compact = false,
}: TrophyShowcaseProps) => {
  const earnedAchievements = achievements.filter(a => a.earned);
  const featuredAchievements = earnedAchievements.slice(0, compact ? 3 : 6);

  const getTrophyLevel = (points: number) => {
    if (points >= 500) return { label: "Платина", icon: Crown, color: "from-gray-300 to-gray-100", textColor: "text-gray-700" };
    if (points >= 300) return { label: "Золото", icon: Gem, color: "from-yellow-400 to-yellow-200", textColor: "text-yellow-700" };
    if (points >= 150) return { label: "Серебро", icon: Medal, color: "from-gray-400 to-gray-200", textColor: "text-gray-600" };
    if (points >= 50) return { label: "Бронза", icon: Star, color: "from-amber-600 to-amber-400", textColor: "text-amber-800" };
    return { label: "Начинающий", icon: Trophy, color: "from-green-500 to-green-300", textColor: "text-green-800" };
  };

  const level = getTrophyLevel(totalPoints);
  const LevelIcon = level.icon;

  const getRarityColor = (points: number) => {
    if (points >= 100) return "border-yellow-500 bg-yellow-500/10";
    if (points >= 50) return "border-purple-500 bg-purple-500/10";
    if (points >= 25) return "border-blue-500 bg-blue-500/10";
    return "border-gray-500 bg-gray-500/10";
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Трофеи
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {earnedCount}/{totalCount}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {/* Trophy Level Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-lg p-3 mb-3 bg-gradient-to-r",
              level.color
            )}
          >
            <div className="flex items-center gap-2">
              <LevelIcon className={cn("h-6 w-6", level.textColor)} />
              <div>
                <div className={cn("font-bold text-sm", level.textColor)}>
                  {level.label}
                </div>
                <div className={cn("text-xs", level.textColor, "opacity-80")}>
                  {totalPoints} очков
                </div>
              </div>
            </div>
          </motion.div>

          {/* Featured Trophies */}
          {featuredAchievements.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {featuredAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "w-10 h-10 rounded-lg border-2 flex items-center justify-center",
                    "cursor-pointer transition-transform hover:scale-110",
                    getRarityColor(achievement.points)
                  )}
                  title={`${achievement.name}: ${achievement.description}`}
                >
                  <span className="text-lg">{achievement.icon}</span>
                </motion.div>
              ))}
              {earnedCount > 3 && (
                <div className="w-10 h-10 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground">
                  +{earnedCount - 3}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              Нет полученных трофеев
            </p>
          )}

          {/* Progress Bar */}
          <div className="mt-3 space-y-1">
            <Progress value={(earnedCount / totalCount) * 100} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trophy Level Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={cn("overflow-hidden")}>
          <div className={cn("bg-gradient-to-r p-6", level.color)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <LevelIcon className={cn("h-12 w-12", level.textColor)} />
                </motion.div>
                <div>
                  <h2 className={cn("text-2xl font-bold", level.textColor)}>
                    {level.label}
                  </h2>
                  <p className={cn("text-sm opacity-80", level.textColor)}>
                    Уровень трофеев
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={cn("text-3xl font-bold", level.textColor)}>
                  {totalPoints}
                </div>
                <div className={cn("text-sm", level.textColor, "opacity-80")}>
                  очков трофеев
                </div>
              </div>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Прогресс коллекции</span>
              <span className="font-medium">{earnedCount} из {totalCount}</span>
            </div>
            <Progress value={(earnedCount / totalCount) * 100} className="h-2" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Trophy Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Полученные трофеи ({earnedCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earnedAchievements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Пока нет полученных трофеев. Будьте активны на форуме!
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {earnedAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className={cn(
                    "rounded-xl border-2 p-4 text-center cursor-pointer",
                    "transition-shadow hover:shadow-lg",
                    getRarityColor(achievement.points)
                  )}
                >
                  <motion.div
                    className="text-4xl mb-2"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    {achievement.icon}
                  </motion.div>
                  <h4 className="font-semibold text-sm mb-1 line-clamp-1">
                    {achievement.name}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {achievement.description}
                  </p>
                  <div className="flex items-center justify-center gap-1 text-xs">
                    <Trophy className="h-3 w-3 text-amber-500" />
                    <span className="font-medium text-amber-600">+{achievement.points}</span>
                  </div>
                  {achievement.earnedAt && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(achievement.earnedAt), "d MMM yyyy", { locale: ru })}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrophyShowcase;
