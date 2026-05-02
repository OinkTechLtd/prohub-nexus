import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface SubForum {
  id: string; slug: string; name: string; description: string | null;
  primary_color: string; accent_color: string; bg_color: string; card_bg: string;
}
interface Cat { id: string; slug: string; name: string; description: string | null; }

const SubForumPanel = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [forum, setForum] = useState<SubForum | null>(null);
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: f } = await supabase.from("sub_forums" as any).select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
      if (f) {
        setForum(f as any);
        const { data: c } = await supabase.from("sub_forum_categories" as any).select("*").eq("sub_forum_id", (f as any).id).order("order_position");
        setCats((c as any) || []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="p-8 text-center">Загрузка...</div>;
  if (!forum) return <div className="p-8 text-center">Подфорум не найден</div>;

  return (
    <div className="min-h-screen" style={{ background: forum.bg_color }}>
      <header className="border-b" style={{ background: `${forum.bg_color}ee`, borderColor: forum.card_bg }}>
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-white"><ArrowLeft className="h-4 w-4 mr-1"/>ProHub</Button>
            <span className="text-lg font-bold" style={{ color: forum.primary_color }}>{forum.name}</span>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {forum.description && <p className="mb-6 text-white/70">{forum.description}</p>}
        <div className="grid gap-3">
          {cats.length === 0 ? (
            <p className="text-white/60 text-center py-8">Разделов пока нет</p>
          ) : cats.map(c => (
            <Card key={c.id} style={{ background: forum.card_bg, borderColor: forum.card_bg }}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg" style={{ color: forum.primary_color }}>{c.name}</h3>
                {c.description && <p className="text-sm text-white/70 mt-1">{c.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SubForumPanel;
