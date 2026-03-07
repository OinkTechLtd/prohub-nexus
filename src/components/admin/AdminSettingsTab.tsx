import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save } from "lucide-react";

interface ForumSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
}

export default function AdminSettingsTab() {
  const [settings, setSettings] = useState<ForumSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("forum_settings")
      .select("*")
      .order("key");
    setSettings((data as any[]) || []);
    setLoading(false);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(settings.map(s => s.key === key ? { ...s, value } : s));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      for (const setting of settings) {
        await supabase
          .from("forum_settings")
          .update({ value: setting.value, updated_by: user?.id } as any)
          .eq("id", setting.id);
      }
      toast({ title: "Настройки сохранены" });
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Настройки форума
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Загрузка...</p>
        ) : (
          <div className="space-y-4">
            {settings.map(setting => (
              <div key={setting.id} className="space-y-1">
                <Label>{setting.description || setting.key}</Label>
                <Input
                  value={setting.value || ""}
                  onChange={e => updateSetting(setting.key, e.target.value)}
                />
              </div>
            ))}
            <Button onClick={saveSettings} disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Сохранение..." : "Сохранить настройки"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
