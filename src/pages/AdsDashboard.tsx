import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, DollarSign, Eye, MousePointerClick, TrendingUp } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  description: string;
  ad_type: string;
  status: string;
  budget_total: number;
  budget_spent: number;
  created_at: string;
  ads: Array<{
    id: string;
    ad_impressions: { count: number }[];
    ad_clicks: { count: number }[];
  }>;
}

const AdsDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [earnings, setEarnings] = useState({ total: 0, withdrawn: 0, available: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    });
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from("ad_campaigns")
        .select(`
          *,
          ads (
            id,
            ad_impressions (count),
            ad_clicks (count)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);

      // Load earnings
      const { data: earningsData, error: earningsError } = await supabase
        .from("user_earnings")
        .select("amount, withdrawn")
        .eq("user_id", user.id);

      if (earningsError) throw earningsError;

      const total = earningsData?.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;
      const withdrawn = earningsData?.filter(e => e.withdrawn).reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0) || 0;
      
      setEarnings({
        total,
        withdrawn,
        available: total - withdrawn,
      });
    } catch (error: any) {
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalImpressions = (campaign: Campaign) => {
    return campaign.ads.reduce((sum, ad) => {
      const impressions = ad.ad_impressions?.[0]?.count || 0;
      return sum + impressions;
    }, 0);
  };

  const getTotalClicks = (campaign: Campaign) => {
    return campaign.ads.reduce((sum, ad) => {
      const clicks = ad.ad_clicks?.[0]?.count || 0;
      return sum + clicks;
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Рекламный кабинет</h1>
            <p className="text-muted-foreground">Управление рекламными кампаниями и заработком</p>
          </div>
          <Button onClick={() => navigate("/create-ad")}>
            <Plus className="mr-2 h-4 w-4" />
            Создать рекламу
          </Button>
        </div>

        {/* Earnings Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего заработано</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${earnings.total.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Выведено</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${earnings.withdrawn.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Доступно</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">${earnings.available.toFixed(2)}</div>
              <Button 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => navigate("/withdraw")}
                disabled={earnings.available < 10}
              >
                Вывести средства
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Мои кампании</h2>
          
          {loading ? (
            <div className="text-center py-12">Загрузка...</div>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                У вас пока нет рекламных кампаний
              </CardContent>
            </Card>
          ) : (
            campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{campaign.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
                    </div>
                    <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                      {campaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Тип</p>
                      <p className="font-semibold">{campaign.ad_type}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Показы</p>
                      </div>
                      <p className="font-semibold">{getTotalImpressions(campaign)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Клики</p>
                      </div>
                      <p className="font-semibold">{getTotalClicks(campaign)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Бюджет</p>
                      <p className="font-semibold">
                        ${parseFloat(campaign.budget_spent.toString()).toFixed(2)} / ${parseFloat(campaign.budget_total.toString()).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AdsDashboard;
