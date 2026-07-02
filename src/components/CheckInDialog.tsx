import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StreakData } from "@/hooks/useStreak";

interface CheckInDialogProps {
  streak: StreakData | null;
  onOpenChange: (open: boolean) => void;
}

const CheckInDialog = ({ streak, onOpenChange }: CheckInDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (streak?.is_new_day) {
      // Check if we already showed it in this session to avoid double popups
      const sessionKey = `checkin_${new Date().toISOString().split('T')[0]}`;
      if (!sessionStorage.getItem(sessionKey)) {
        setIsOpen(true);
        sessionStorage.setItem(sessionKey, 'true');
      }
    }
  }, [streak]);

  if (!streak) return null;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md border-none bg-gradient-to-b from-background to-accent/20">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <motion.div
              initial={{ scale: 0.5, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 10, stiffness: 100 }}
            >
              <Flame className="h-12 w-12 text-orange-500 fill-orange-500" />
            </motion.div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            {streak.current_streak === 1 ? "С возвращением!" : "Ежедневный вход!"}
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Ваша серия: <span className="font-bold text-primary">{streak.current_streak} дн.</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center justify-center space-y-4">
          <AnimatePresence>
            {streak.milestone_bonus ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/5 border border-primary/20 w-full"
              >
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Trophy className="h-5 w-5" />
                  Бонус за достижение!
                </div>
                <div className="text-3xl font-black text-primary">
                  +{streak.milestone_bonus} <span className="text-sm font-normal">репутации</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground"
              >
                Продолжайте заходить каждый день, чтобы получать бонусы репутации!
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 mt-4">
            {[...Array(7)].map((_, i) => {
              const day = i + 1;
              const isPast = day < (streak.current_streak % 7 || 7);
              const isCurrent = day === (streak.current_streak % 7 || 7);
              
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                    isCurrent ? 'border-primary bg-primary/10 text-primary' : 
                    isPast ? 'border-green-500 bg-green-500/10 text-green-500' : 
                    'border-muted bg-muted/50 text-muted-foreground'
                  }`}>
                    {isPast ? <Star className="h-4 w-4 fill-current" /> : <span className="text-xs font-bold">{day}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">Дни недели до следующего бонуса</p>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button onClick={() => handleOpenChange(false)} className="w-full sm:w-32">
            Отлично!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CheckInDialog;
