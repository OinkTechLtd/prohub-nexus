import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, History, User } from "lucide-react";
import { hideContent, unhideContent, getModerationHistory } from "@/lib/moderation";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ModerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: 'topic' | 'post' | 'resource' | 'video';
  contentId: string;
  contentTitle: string;
  isHidden: boolean;
  onSuccess?: () => void;
}

const ModerationDialog = ({
  open,
  onOpenChange,
  contentType,
  contentId,
  contentTitle,
  isHidden,
  onSuccess,
}: ModerationDialogProps) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, contentId]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await getModerationHistory(contentType, contentId);
      setHistory(data || []);
    } catch (error: any) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleHide = async () => {
    if (!reason.trim()) {
      toast({
        title: "Ошибка",
        description: "Укажите причину скрытия",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await hideContent(contentType, contentId, reason);
      toast({
        title: "Контент скрыт",
        description: "Контент успешно скрыт",
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnhide = async () => {
    setLoading(true);
    try {
      await unhideContent(contentType, contentId, reason.trim() || undefined);
      toast({
        title: "Контент восстановлен",
        description: "Контент успешно восстановлен",
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Модерация контента</DialogTitle>
          <DialogDescription className="break-words">
            {contentTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Статус: {isHidden ? (
                <span className="text-destructive font-semibold">Скрыт</span>
              ) : (
                <span className="text-green-600 font-semibold">Активен</span>
              )}
            </AlertDescription>
          </Alert>

          {/* Moderation History */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="h-4 w-4" />
                  История модерации
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 space-y-2 max-h-40 overflow-y-auto">
                {history.map((item, index) => (
                  <div key={index} className="text-sm border-l-2 border-primary/30 pl-3 py-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{item.profiles?.username || 'Система'}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(item.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                      </span>
                    </div>
                    <p className="text-sm mt-1 font-medium">{item.reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">
              Причина {isHidden ? 'восстановления (опционально)' : 'скрытия (обязательно)'}
            </Label>
            <Textarea
              id="reason"
              placeholder={isHidden 
                ? "Укажите причину восстановления..." 
                : "Укажите причину скрытия..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            {isHidden ? (
              <Button onClick={handleUnhide} disabled={loading}>
                Восстановить
              </Button>
            ) : (
              <Button
                onClick={handleHide}
                disabled={loading}
                variant="destructive"
              >
                Скрыть контент
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModerationDialog;
