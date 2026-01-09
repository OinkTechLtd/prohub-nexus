import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, Send, Loader2 } from "lucide-react";

interface ModeratorApplicationFormProps {
  onSuccess?: () => void;
}

const ModeratorApplicationForm = ({ onSuccess }: ModeratorApplicationFormProps) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<"moderator" | "editor">("moderator");
  const [experience, setExperience] = useState("");
  const [onlineTime, setOnlineTime] = useState("");
  const [contribution, setContribution] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingApplication, setExistingApplication] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      checkExistingApplication(session.user.id);
    }
  };

  const checkExistingApplication = async (userId: string) => {
    const { data } = await supabase
      .from("moderator_applications")
      .select("id, status")
      .eq("user_id", userId)
      .eq("status", "pending")
      .limit(1);
    
    if (data && data.length > 0) {
      setExistingApplication(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!experience.trim() || !onlineTime.trim() || !contribution.trim()) {
      toast({
        title: "Заполните все поля",
        description: "Все поля заявки обязательны",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create application
      const { data: application, error } = await supabase
        .from("moderator_applications")
        .insert({
          user_id: user.id,
          applied_role: role,
          experience: experience.trim(),
          online_time: onlineTime.trim(),
          contribution: contribution.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger AI analysis
      await supabase.functions.invoke("prohub-bot", {
        body: {
          action: "analyze_mod_application",
          data: {
            applicationId: application.id,
            userId: user.id,
            experience: experience.trim(),
            onlineTime: onlineTime.trim(),
            contribution: contribution.trim(),
          },
        },
      });

      toast({
        title: "Заявка отправлена",
        description: "Ваша заявка будет рассмотрена администрацией",
      });

      setExistingApplication(true);
      onSuccess?.();
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

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Войдите, чтобы подать заявку на модератора
        </CardContent>
      </Card>
    );
  }

  if (existingApplication) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Badge variant="secondary" className="mb-4">На рассмотрении</Badge>
          <p className="text-muted-foreground">
            У вас уже есть активная заявка. Дождитесь её рассмотрения.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Заявка на роль модератора/редактора
        </CardTitle>
        <CardDescription>
          Заполните форму ниже. AI-бот ProHub проанализирует вашу заявку и даст рекомендацию администрации.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Желаемая роль</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "moderator" | "editor")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moderator">Модератор</SelectItem>
                <SelectItem value="editor">Редактор</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Опыт модерации (другие форумы, сообщества)</Label>
            <Textarea
              id="experience"
              placeholder="Расскажите о вашем опыте модерации..."
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="onlineTime">Сколько времени проводите на форуме?</Label>
            <Textarea
              id="onlineTime"
              placeholder="Например: 2-3 часа в день, преимущественно вечером..."
              value={onlineTime}
              onChange={(e) => setOnlineTime(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contribution">Чем вы можете помочь форуму?</Label>
            <Textarea
              id="contribution"
              placeholder="Опишите, как вы планируете помогать сообществу..."
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Отправка...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Отправить заявку
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ModeratorApplicationForm;
