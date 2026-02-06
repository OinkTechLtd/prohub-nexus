import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flag, EyeOff, CheckCircle, X, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import WarningDialog from "@/components/WarningDialog";

interface Report {
  id: string;
  reporter_id: string;
  content_type: string;
  content_id: string;
  content_author_id: string | null;
  reason: string;
  details: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reporter?: { username: string; avatar_url: string | null };
  author?: { username: string; avatar_url: string | null };
  content_title?: string;
}

interface AdminReportsTabProps {
  currentUserId: string;
}

const AdminReportsTab = ({ currentUserId }: AdminReportsTabProps) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("content_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const enriched = await Promise.all(
        (data || []).map(async (report) => {
          const [reporterRes, authorRes] = await Promise.all([
            supabase.from("profiles").select("username, avatar_url").eq("id", report.reporter_id).single(),
            report.content_author_id
              ? supabase.from("profiles").select("username, avatar_url").eq("id", report.content_author_id).single()
              : Promise.resolve({ data: null }),
          ]);

          let contentTitle = "";
          if (report.content_type === "topic") {
            const { data: t } = await supabase.from("topics").select("title").eq("id", report.content_id).single();
            contentTitle = t?.title || "";
          } else if (report.content_type === "resource") {
            const { data: r } = await supabase.from("resources").select("title").eq("id", report.content_id).single();
            contentTitle = r?.title || "";
          } else if (report.content_type === "video") {
            const { data: v } = await supabase.from("videos").select("title").eq("id", report.content_id).single();
            contentTitle = v?.title || "";
          } else if (report.content_type === "post") {
            const { data: p } = await supabase.from("posts").select("content").eq("id", report.content_id).single();
            contentTitle = (p?.content || "").substring(0, 60) + "...";
          }

          return {
            ...report,
            reporter: reporterRes.data || undefined,
            author: authorRes.data || undefined,
            content_title: contentTitle,
          };
        })
      );

      setReports(enriched);
    } catch (error: any) {
      toast({ title: "Ошибка загрузки жалоб", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("content_reports")
        .update({
          status,
          admin_id: currentUserId,
          admin_notes: adminNotes[reportId] || null,
          resolved_at: status !== "pending" ? new Date().toISOString() : null,
        })
        .eq("id", reportId);

      if (error) throw error;
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
      toast({ title: "Статус обновлён" });
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  };

  const hideContent = async (report: Report) => {
    try {
      await supabase.rpc("set_content_hidden", {
        _content_type: report.content_type,
        _content_id: report.content_id,
        _hidden: true,
        _reason: `Жалоба: ${report.reason}`,
      });

      await updateReportStatus(report.id, "resolved");
      toast({ title: "Контент скрыт" });
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      topic: "Тема", post: "Пост", resource: "Ресурс", video: "Видео",
    };
    return map[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="border-yellow-500/50 text-yellow-600 dark:text-yellow-400">Ожидает</Badge>;
      case "reviewed": return <Badge variant="outline" className="border-blue-500/50 text-blue-600 dark:text-blue-400">На рассмотрении</Badge>;
      case "resolved": return <Badge variant="outline" className="border-green-500/50 text-green-600 dark:text-green-400">Решено</Badge>;
      case "dismissed": return <Badge variant="outline" className="text-muted-foreground">Отклонено</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = reports.filter(r => r.status === "pending").length;

  if (loading) return <div className="text-center py-8 text-muted-foreground">Загрузка жалоб...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          Жалобы
          {pendingCount > 0 && (
            <Badge variant="destructive">{pendingCount}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Жалоб нет</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{getTypeLabel(report.content_type)}</Badge>
                    {getStatusBadge(report.status)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ru })}
                  </span>
                </div>

                <div className="bg-muted/50 p-3 rounded text-sm">
                  <p className="font-medium">{report.content_title || "Контент удалён"}</p>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Причина: </span>
                  <span className="font-medium">{report.reason}</span>
                </div>

                {report.details && (
                  <p className="text-sm text-muted-foreground">{report.details}</p>
                )}

                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={report.reporter?.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px]">{report.reporter?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground">от {report.reporter?.username}</span>
                  </div>
                  {report.author && (
                    <span className="text-muted-foreground">→ автор: <strong>{report.author.username}</strong></span>
                  )}
                </div>

                {report.status === "pending" && (
                  <>
                    <Textarea
                      placeholder="Заметки модератора..."
                      value={adminNotes[report.id] || ""}
                      onChange={(e) => setAdminNotes(prev => ({ ...prev, [report.id]: e.target.value }))}
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => hideContent(report)}>
                        <EyeOff className="h-3.5 w-3.5 mr-1" />
                        Скрыть контент
                      </Button>
                      {report.content_author_id && (
                        <WarningDialog
                          targetUserId={report.content_author_id}
                          targetUsername={report.author?.username || "Пользователь"}
                          moderatorId={currentUserId}
                          onWarningIssued={() => {
                            updateReportStatus(report.id, "resolved");
                          }}
                        />
                      )}
                      <Button size="sm" variant="outline" className="text-green-600 dark:text-green-400" onClick={() => updateReportStatus(report.id, "resolved")}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Решено
                      </Button>
                      <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => updateReportStatus(report.id, "dismissed")}>
                        <X className="h-3.5 w-3.5 mr-1" />
                        Отклонить
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminReportsTab;
