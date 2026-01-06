import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface UsernameHistoryProps {
  userId: string;
  currentUsername: string;
}

interface HistoryItem {
  id: string;
  old_username: string;
  new_username: string;
  changed_at: string;
}

const UsernameHistory = ({ userId, currentUsername }: UsernameHistoryProps) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, userId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("username_history" as any)
        .select("*")
        .eq("user_id", userId)
        .order("changed_at", { ascending: false });

      if (error) throw error;
      setHistory((data as unknown as HistoryItem[]) || []);
    } catch (error) {
      console.error("Error loading username history:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">История ников</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            История никнеймов
          </DialogTitle>
          <DialogDescription>
            Текущий ник: <span className="font-semibold">{currentUsername}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-center py-4 text-muted-foreground">Загрузка...</p>
        ) : history.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">
            Никнейм не менялся
          </p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {history.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through">{item.old_username}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-medium">{item.new_username}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.changed_at), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UsernameHistory;