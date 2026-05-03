import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import SubForumHeader from "@/components/SubForumHeader";
import { useToast } from "@/hooks/use-toast";

const SubForumCreateTopic = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();
  const [forum, setForum] = useState<any>(null);
  const [cats, setCats] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { navigate("/auth"); return; }
      setUser(session.user);
    });
    (async () => {
      const { data: f } = await supabase.from("sub_forums" as any).select("*").eq("slug", slug).maybeSingle();
      if (!f) return;
      setForum(f);
      const { data: c } = await supabase.from("sub_forum_categories" as any).select("*").eq("sub_forum_id", (f as any).id).order("order_position");
      setCats((c as any) || []);
      const presetSlug = params.get("cat");
      if (presetSlug) {
        const found = ((c as any) || []).find((x: any) => x.slug === presetSlug);
        if (found) setCategoryId(found.id);
      } else if ((c as any)?.[0]) setCategoryId((c as any)[0].id);
    })();
  }, [slug]);

  const submit = async () => {
    if (!user || !forum) return;
    if (!title.trim() || !content.trim() || !categoryId) {
      toast({ title: "Заполните все поля", variant: "destructive" }); return;
    }
    setSubmitting(true);
    const { data, error } = await (supabase.from("sub_forum_topics" as any).insert({
      sub_forum_id: forum.id, category_id: categoryId, user_id: user.id,
      title: title.trim(), content: content.trim(),
    }).select().single() as any);
    setSubmitting(false);
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Тема создана" });
    navigate(`/f/${slug}/t/${(data as any).id}`);
  };

  if (!forum) return <div className="p-8 text-center text-white">Загрузка...</div>;

  return (
    <div className="min-h-screen text-white" style={{ background: forum.bg_color }}>
      <SubForumHeader forum={forum} />
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-3xl">
        <h1 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: forum.primary_color }}>Новая тема</h1>
        <Card style={{ background: forum.card_bg }} className="border-0">
          <CardContent className="p-4 space-y-3">
            <div>
              <Label className="text-white/80">Раздел</Label>
              <select
                className="w-full h-10 rounded-md px-3 text-sm bg-white/5 border border-white/10 text-white"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {cats.map(c => <option key={c.id} value={c.id} className="text-black">{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-white/80">Заголовок</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/80">Содержание (BBCode)</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate(`/f/${slug}`)} className="border-white/20 text-white">Отмена</Button>
              <Button onClick={submit} disabled={submitting} style={{ background: forum.primary_color }} className="text-white">
                {submitting ? "Создание..." : "Создать"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SubForumCreateTopic;
