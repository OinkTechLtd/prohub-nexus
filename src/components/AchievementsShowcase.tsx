import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/Badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Star, Lock, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

interface AchievementsShowcaseProps {
  achievements: Achievement[];
  totalPoints: number;
  earnedCount: number;
  totalCount: number;
  userStats?: {
    posts_count?: number;
    topics_count?: number;
    resources_count?: number;
    videos_count?: number;
    days_registered?: number;
  };
  className?: string;
}

const AchievementsShowcase = ({
  achievements,
  totalPoints,
  earnedCount,
  totalCount,
  userStats = {},
  className,
}: AchievementsShowcaseProps) => {
  const earnedAchievements = achievements.filter(a => a.earned);
  const lockedAchievements = achievements.filter(a => !a.earned);
  
  // Find next achievement to unlock
  const nextAchievement = lockedAchievements[0];
  
  const getProgressForAchievement = (achievement: Achievement) => {
    const stats: Record<string, number> = {
      posts_count: userStats.posts_count || 0,
      topics_count: userStats.topics_count || 0,
      resources_count: userStats.resources_count || 0,
      videos_count: userStats.videos_count || 0,
      days_registered: userStats.days_registered || 0,
    };
    
    const current = stats[achievement.condition_type] || 0;
    const target = achievement.condition_value;
    return Math.min((current / target) * 100, 100);
  };

  const getRarityLabel = (points: number) => {
    if (points >= 100) return { label: 'Легендарный', color: 'text-yellow-500' };
    if (points >= 50) return { label: 'Эпический', color: 'text-purple-500' };
    if (points >= 25) return { label: 'Редкий', color: 'text-blue-500' };
    return { label: 'Обычный', color: 'text-gray-500' };
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-4"
      >
        <Card className="text-center p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-amber-500" />
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalPoints}</div>
          <div className="text-sm text-muted-foreground">Очков</div>
        </Card>
        
        <Card className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <Star className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{earnedCount}</div>
          <div className="text-sm text-muted-foreground">Получено</div>
        </Card>
        
        <Card className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30">
          <Sparkles className="h-8 w-8 mx-auto mb-2 text-blue-500" />
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {Math.round((earnedCount / totalCount) * 100)}%
          </div>
          <div className="text-sm text-muted-foreground">Прогресс</div>
        </Card>
      </motion.div>

      {/* Next Achievement Progress */}
      {nextAchievement && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-dashed border-2 border-primary/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Следующее достижение
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Badge icon={nextAchievement.icon} color="gray" size="lg" />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    style={{ borderStyle: 'dashed' }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{nextAchievement.name}</span>
                    <span className="text-xs text-primary">+{nextAchievement.points} очков</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{nextAchievement.description}</p>
                  <Progress value={getProgressForAchievement(nextAchievement)} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Earned Achievements */}
      {earnedAchievements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Полученные достижения
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {earnedAchievements.map((achievement, index) => {
                const rarity = getRarityLabel(achievement.points);
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <Card className="relative overflow-hidden group">
                      {/* Shine Effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                        initial={{ x: '-200%' }}
                        whileHover={{ x: '200%' }}
                        transition={{ duration: 0.8 }}
                      />
                      
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <motion.div
                            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                            transition={{ duration: 0.5 }}
                          >
                            <Badge icon={achievement.icon} color={achievement.badge_color} size="md" />
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm truncate">{achievement.name}</h3>
                              <span className={cn("text-xs", rarity.color)}>{rarity.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {achievement.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-primary">+{achievement.points} очков</span>
                              {achievement.earnedAt && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(achievement.earnedAt), "d MMM yyyy", { locale: ru })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Check Mark */}
                        <motion.div
                          className="absolute top-2 right-2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                        >
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
            <Lock className="h-5 w-5" />
            Заблокированные достижения ({lockedAchievements.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lockedAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 0.6, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ opacity: 0.8 }}
              >
                <Card className="relative overflow-hidden bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Badge icon={achievement.icon} color="gray" size="md" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1">{achievement.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            +{achievement.points} очков
                          </span>
                          <Progress 
                            value={getProgressForAchievement(achievement)} 
                            className="w-20 h-1.5" 
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AchievementsShowcase;
