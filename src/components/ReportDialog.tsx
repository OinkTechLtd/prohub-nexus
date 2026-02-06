import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Flag } from "lucide-react";

interface ReportDialogProps {
  contentType: "topic" | "post" | "resource" | "video";
  contentId: string;
  contentAuthorId?: string;
  trigger?: React.ReactNode;
}

const REPORT_REASONS = [
  { value: "spam", label: "Спам" },
  { value: "inappropriate", label: "Неприемлемый контент" },
  { value: "harassment", label: "Оскорбления / Травля" },
  { value: "misinformation", label: "Дезинформация" },
  { value: "copyright", label: "Нарушение авторских прав" },
  { value: "other", label: "Другое" },
];

const ReportDialog = ({ contentType, contentId, contentAuthorId, trigger }: ReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason) {
      toast({ title: "Выберите причину жалобы", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Войдите в систему", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("content_reports").insert({
        reporter_id: session.user.id,
        content_type: contentType,
        content_id: contentId,
        content_author_id: contentAuthorId || null,
        reason: REPORT_REASONS.find(r => r.value === reason)?.label || reason,
        details: details.trim() || null,
      });

      if (error) throw error;

      toast({ title: "Жалоба отправлена", description: "Модераторы рассмотрят вашу жалобу" });
      setOpen(false);
      setReason("");
      setDetails("");
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
            <Flag className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Пожаловаться</DialogTitle>
          <DialogDescription>
            Опишите нарушение. Модераторы рассмотрят жалобу.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Причина жалобы" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Дополнительные детали (необязательно)..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
            <Button variant="destructive" onClick={handleSubmit} disabled={submitting || !reason}>
              {submitting ? "Отправка..." : "Отправить жалобу"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
