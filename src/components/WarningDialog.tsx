import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WarningType {
  id: string;
  name: string;
  points: number;
  expires_days: number | null;
  description: string | null;
}

interface WarningDialogProps {
  targetUserId: string;
  targetUsername: string;
  moderatorId: string;
  onWarningIssued?: () => void;
}

export const WarningDialog = ({
  targetUserId,
  targetUsername,
  moderatorId,
  onWarningIssued,
}: WarningDialogProps) => {
  const [open, setOpen] = useState(false);
  const [warningTypes, setWarningTypes] = useState<WarningType[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadWarningTypes = async () => {
      const { data } = await supabase
        .from("warning_types")
        .select("*")
        .order("points");

      if (data) {
        setWarningTypes(data);
      }
    };

    if (open) {
      loadWarningTypes();
    }
  }, [open]);

  const handleIssueWarning = async () => {
    if (!selectedType || !reason.trim()) {
      toast({
        title: "Заполните все поля",
        description: "Выберите тип предупреждения и укажите причину",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const warningType = warningTypes.find((t) => t.id === selectedType);
      if (!warningType) return;

      const expiresAt = warningType.expires_days
        ? new Date(
            Date.now() + warningType.expires_days * 24 * 60 * 60 * 1000
          ).toISOString()
        : null;

      // Insert warning
      const { error: warningError } = await supabase
        .from("user_warnings")
        .insert({
          user_id: targetUserId,
          moderator_id: moderatorId,
          warning_type_id: selectedType,
          points: warningType.points,
          reason: reason.trim(),
          notes: notes.trim() || null,
          expires_at: expiresAt,
        });

      if (warningError) throw warningError;

      // Check and apply automatic sanctions
      const { data: sanction } = await supabase.rpc("check_and_apply_sanctions", {
        _user_id: targetUserId,
        _moderator_id: moderatorId,
      });

      let sanctionMessage = "";
      if (sanction === "permanent_ban") {
        sanctionMessage = " Автоматически применён перманентный бан!";
      } else if (sanction === "ban_30_days") {
        sanctionMessage = " Автоматически применён бан на 30 дней!";
      } else if (sanction === "ban_7_days") {
        sanctionMessage = " Автоматически применён бан на 7 дней!";
      } else if (sanction === "ban_1_day") {
        sanctionMessage = " Автоматически применён бан на 1 день!";
      }

      toast({
        title: "⚠️ Предупреждение выдано",
        description: `${targetUsername} получил ${warningType.points} балл(ов) за "${warningType.name}".${sanctionMessage}`,
      });

      setOpen(false);
      setSelectedType("");
      setReason("");
      setNotes("");
      onWarningIssued?.();
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

  const selectedWarningType = warningTypes.find((t) => t.id === selectedType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <AlertTriangle className="h-4 w-4 mr-1" />
          Предупреждение
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            Выдать предупреждение
          </DialogTitle>
          <DialogDescription>
            Выдать предупреждение пользователю <strong>{targetUsername}</strong>.
            Баллы накапливаются и могут привести к автоматическим санкциям.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Тип нарушения</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип нарушения" />
              </SelectTrigger>
              <SelectContent>
                {warningTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 text-xs rounded font-medium ${
                          type.points >= 5
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : type.points >= 3
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {type.points} б.
                      </span>
                      {type.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedWarningType && (
              <p className="text-sm text-muted-foreground">
                {selectedWarningType.description}
                {selectedWarningType.expires_days && (
                  <span className="block mt-1">
                    Истекает через {selectedWarningType.expires_days} дней
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Причина (видна пользователю)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Опишите конкретное нарушение..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Заметки модератора (только для персонала)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Внутренние заметки..."
              rows={2}
            />
          </div>

          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <p className="font-medium mb-2">Автоматические санкции:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• 5 баллов → Бан на 1 день</li>
              <li>• 7 баллов → Бан на 7 дней</li>
              <li>• 10 баллов → Бан на 30 дней</li>
              <li>• 15+ баллов → Перманентный бан</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button
            variant="destructive"
            onClick={handleIssueWarning}
            disabled={loading || !selectedType || !reason.trim()}
          >
            {loading ? "Выдача..." : "Выдать предупреждение"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WarningDialog;
