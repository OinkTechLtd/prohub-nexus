import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import ModeratorApplicationForm from "@/components/ModeratorApplicationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Shield, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Application {
  id: string;
  user_id: string;
  applied_role: string;
  experience: string;
  online_time: string;
  contribution: string;
  ai_recommendation: string | null;
  status: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

const ModeratorApplications = () => {
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, isModerator } = useUserRole();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user, isAdmin, isModerator]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      // Load my applications
      const { data: myApps } = await supabase
        .from("moderator_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setMyApplications(myApps || []);

      // Load all pending applications for admins/moderators
      if (isAdmin || isModerator) {
        const { data: allApps } = await supabase
          .from("moderator_applications")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        // Load profiles separately
        if (allApps && allApps.length > 0) {
          const userIds = allApps.map(app => app.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .in("id", userIds);

          const appsWithProfiles = allApps.map(app => ({
            ...app,
            profiles: profiles?.find(p => p.id === app.user_id) || undefined
          }));
          
          setApplications(appsWithProfiles);
        } else {
          setApplications([]);
        }
      }
    } catch (error) {
      console.error("Error loading applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: "approved" | "rejected", userId: string, role: string) => {
    try {
      // Update application status
      await supabase
        .from("moderator_applications")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", applicationId);

      // If approved, assign role
      if (newStatus === "approved") {
        await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: role as "editor" | "moderator",
            can_moderate_resources: role === "moderator",
            can_moderate_topics: role === "moderator",
          });

        toast({
          title: "Заявка одобрена",
          description: `Пользователю выдана роль ${role}`,
        });
      } else {
        toast({
          title: "Заявка отклонена",
        });
      }

      loadApplications();
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400"><CheckCircle className="h-3 w-3 mr-1" /> Одобрена</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-400"><XCircle className="h-3 w-3 mr-1" /> Отклонена</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400"><Clock className="h-3 w-3 mr-1" /> На рассмотрении</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Заявки на модератора
          </h1>
          <p className="text-muted-foreground">
            Подайте заявку на роль модератора или редактора форума
          </p>
        </div>

        {/* Application Form */}
        <div className="mb-8">
          <ModeratorApplicationForm onSuccess={loadApplications} />
        </div>

        {/* My Applications */}
        {myApplications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Мои заявки</h2>
            <div className="space-y-4">
              {myApplications.map((app) => (
                <Card key={app.id}>
                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Заявка на {app.applied_role === "moderator" ? "модератора" : "редактора"}
                      </CardTitle>
                      {getStatusBadge(app.status)}
                    </div>
                    <CardDescription>
                      {format(new Date(app.created_at), "d MMMM yyyy, HH:mm", { locale: ru })}
                    </CardDescription>
                  </CardHeader>
                  {app.ai_recommendation && (
                    <CardContent className="pt-0">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Рекомендация AI:</p>
                        <p className="text-sm">{app.ai_recommendation}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Admin: All Pending Applications */}
        {(isAdmin || isModerator) && applications.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Заявки на рассмотрение ({applications.length})
            </h2>
            <div className="space-y-4">
              {applications.map((app) => (
                <Card key={app.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {app.profiles?.username} → {app.applied_role}
                      </CardTitle>
                      {getStatusBadge(app.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Опыт:</p>
                      <p className="text-sm">{app.experience}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Время онлайн:</p>
                      <p className="text-sm">{app.online_time}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Вклад:</p>
                      <p className="text-sm">{app.contribution}</p>
                    </div>
                    {app.ai_recommendation && (
                      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-xs text-primary mb-1 font-medium">🤖 Рекомендация AI:</p>
                        <p className="text-sm">{app.ai_recommendation}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(app.id, "approved", app.user_id, app.applied_role)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Одобрить
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdateStatus(app.id, "rejected", app.user_id, app.applied_role)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Отклонить
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ModeratorApplications;
