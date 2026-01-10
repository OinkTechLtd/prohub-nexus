import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BadgeCheck, Loader2 } from "lucide-react";

interface VerificationRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

const VerificationRequestForm = ({ open, onOpenChange, userId }: VerificationRequestFormProps) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (reason.trim().length < 20) {
      toast({
        title: "Ошибка",
        description: "Опишите причину подробнее (минимум 20 символов)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if there's already a pending request
      const { data: existing } = await supabase
        .from("verification_requests")
        .select("id, status")
        .eq("user_id", userId)
        .eq("status", "pending")
        .maybeSingle();

      if (existing) {
        toast({
          title: "Заявка уже существует",
          description: "У вас уже есть активная заявка на верификацию",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("verification_requests")
        .insert({
          user_id: userId,
          reason: reason.trim(),
        });

      if (error) throw error;

      toast({
        title: "Заявка отправлена",
        description: "Ваша заявка на верификацию будет рассмотрена администратором",
      });
      setReason("");
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-primary" />
            Заявка на верификацию
          </DialogTitle>
          <DialogDescription>
            Верификация подтверждает вашу личность и добавляет галочку к профилю
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Почему вы хотите получить верификацию?</Label>
            <Textarea
              id="reason"
              placeholder="Расскажите о себе, своей деятельности, почему считаете нужным получить верификацию..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
              required
            />
            <p className="text-xs text-muted-foreground">
              Минимум 20 символов. {reason.length}/20
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Отправить заявку
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationRequestForm;