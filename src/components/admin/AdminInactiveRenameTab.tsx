import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, PlayCircle } from "lucide-react";

interface RunRow {
  id: string;
  ran_at: string;
  renamed_count: number;
  duration_ms: number | null;
  triggered_by: string | null;
  error: string | null;
}

const AdminInactiveRenameTab = () => {
  const [rows, setRows] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inactive_rename_runs" as any)
      .select("*")
      .order("ran_at", { ascending: false })
      .limit(50);
    if (!error && data) setRows(data as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runNow = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("rename-inactive-users", {
        body: { manual: true },
      });
      if (error) throw error;
      toast({ title: "Готово", description: `Переименовано: ${data?.renamed_count ?? 0}` });
      await load();
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <span>Отчёт: переименования неактивных пользователей (14 дней)</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Обновить
            </Button>
            <Button size="sm" onClick={runNow} disabled={running}>
              <PlayCircle className="h-4 w-4 mr-1" /> Запустить сейчас
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Записей пока нет. Cron запускается ежедневно в 03:00 UTC.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3 border rounded-md text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={r.error ? "destructive" : "default"}>
                    {r.error ? "Ошибка" : "OK"}
                  </Badge>
                  <span className="text-muted-foreground">{new Date(r.ran_at).toLocaleString("ru-RU")}</span>
                  <Badge variant="outline">{r.triggered_by || "cron"}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span><strong>{r.renamed_count}</strong> переименовано</span>
                  <span className="text-muted-foreground">{r.duration_ms ?? "-"} мс</span>
                </div>
                {r.error && <p className="w-full text-destructive text-xs">{r.error}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminInactiveRenameTab;
