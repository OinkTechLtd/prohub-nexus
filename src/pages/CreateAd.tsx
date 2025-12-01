import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

const INTEREST_OPTIONS = [
  "programming", "design", "video", "tutorials", "resources",
  "forum", "news", "technology", "education"
];

const CreateAd = () => {
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [adType, setAdType] = useState<"video" | "banner" | "text">("banner");
  const [clickUrl, setClickUrl] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [targetInterests, setTargetInterests] = useState<string[]>([]);
  const [budgetTotal, setBudgetTotal] = useState("10");
  const [costPerView, setCostPerView] = useState("0.01");
  const [costPerClick, setCostPerClick] = useState("0.05");
  const [loading, setLoading] = useState(false);
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

  const toggleInterest = (interest: string) => {
    setTargetInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (targetInterests.length === 0) {
      toast({
        title: "Выберите интересы",
        description: "Необходимо выбрать хотя бы один интерес для таргетинга",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let mediaUrl = null;

      // Upload media file if provided
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('resource-files')
          .upload(fileName, mediaFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('resource-files')
          .getPublicUrl(fileName);

        mediaUrl = publicUrl;
      }

      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from("ad_campaigns")
        .insert({
          user_id: user.id,
          title,
          description,
          ad_type: adType,
          target_interests: targetInterests,
          budget_total: parseFloat(budgetTotal),
          cost_per_view: parseFloat(costPerView),
          cost_per_click: parseFloat(costPerClick),
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Create ad
      const { error: adError } = await supabase
        .from("ads")
        .insert({
          campaign_id: campaign.id,
          title,
          description,
          media_url: mediaUrl,
          click_url: clickUrl || null,
          width: adType === "banner" ? 728 : null,
          height: adType === "banner" ? 90 : null,
          duration: adType === "video" ? 15 : null,
        });

      if (adError) throw adError;

      toast({
        title: "Реклама создана",
        description: "Ваша рекламная кампания успешно запущена",
      });

      navigate("/ads-dashboard");
    } catch (error: any) {
      toast({
        title: "Ошибка создания рекламы",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Создать рекламу</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="adType">Тип рекламы</Label>
                <Select value={adType} onValueChange={(v: any) => setAdType(v)} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Баннер</SelectItem>
                    <SelectItem value="video">Видео</SelectItem>
                    <SelectItem value="text">Текстовая</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Название кампании</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {adType !== "text" && (
                <div className="space-y-2">
                  <Label htmlFor="media">Загрузить {adType === "video" ? "видео" : "изображение"}</Label>
                  <Input
                    id="media"
                    type="file"
                    onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                    accept={adType === "video" ? "video/*" : "image/*"}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="clickUrl">URL для перехода</Label>
                <Input
                  id="clickUrl"
                  type="url"
                  value={clickUrl}
                  onChange={(e) => setClickUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Таргетинг по интересам</Label>
                <div className="grid grid-cols-2 gap-4">
                  {INTEREST_OPTIONS.map((interest) => (
                    <div key={interest} className="flex items-center space-x-2">
                      <Checkbox
                        id={interest}
                        checked={targetInterests.includes(interest)}
                        onCheckedChange={() => toggleInterest(interest)}
                      />
                      <Label htmlFor={interest} className="cursor-pointer">
                        {interest}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Бюджет ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={budgetTotal}
                    onChange={(e) => setBudgetTotal(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpv">Цена за показ ($)</Label>
                  <Input
                    id="cpv"
                    type="number"
                    step="0.001"
                    value={costPerView}
                    onChange={(e) => setCostPerView(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpc">Цена за клик ($)</Label>
                  <Input
                    id="cpc"
                    type="number"
                    step="0.001"
                    value={costPerClick}
                    onChange={(e) => setCostPerClick(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Создание..." : "Создать рекламу"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateAd;
