import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const AdminAuditLogTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("moderation_audit_log" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      const list = (data as any) || [];
      if (list.length) {
        const ids = Array.from(new Set(list.map((r: any) => r.moderator_id as string))) as string[];
        const { data: profs } = await supabase.from("profiles").select("id,username").in("id", ids);
        const m: Record<string, string> = {};
        (profs || []).forEach((p: any) => (m[p.id] = p.username));
        list.forEach((r: any) => (r._moder = m[r.moderator_id]));
      }
      setRows(list);
      setLoading(false);
    })();
  }, []);

  return (
    <Card>
      <CardHeader><CardTitle>Журнал действий модераторов</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {loading ? <p className="text-sm text-muted-foreground">Загрузка...</p> :
          rows.length === 0 ? <p className="text-sm text-muted-foreground">Записей нет.</p> :
          rows.map((r) => (
            <div key={r.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 p-2 rounded border text-xs sm:text-sm">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline">{r.scope}</Badge>
                <Badge>{r.action}</Badge>
                <span className="text-muted-foreground">{r.content_type}</span>
                <code className="text-[10px] text-muted-foreground truncate max-w-[160px]">{r.content_id}</code>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <span>{r._moder || r.moderator_id?.slice(0, 8)}</span>
                <span>{format(new Date(r.created_at), "dd.MM HH:mm", { locale: ru })}</span>
                {r.reason && <span className="italic truncate max-w-[200px]">«{r.reason}»</span>}
              </div>
            </div>
          ))}
      </CardContent>
    </Card>
  );
};

export default AdminAuditLogTab;
