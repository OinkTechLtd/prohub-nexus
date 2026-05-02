import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, FolderPlus } from "lucide-react";

interface SubForum {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  primary_color: string;
  accent_color: string;
  bg_color: string;
  card_bg: string;
  is_active: boolean;
}

interface SubForumCategory {
  id: string;
  sub_forum_id: string;
  slug: string;
  name: string;
  description: string | null;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 40);

const AdminSubForumsTab = () => {
  const [forums, setForums] = useState<SubForum[]>([]);
  const [cats, setCats] = useState<Record<string, SubForumCategory[]>>({});
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "",
    primary_color: "#10b981", accent_color: "#059669",
    bg_color: "#1a1a2e", card_bg: "#16213e",
    initial_categories: "Общее, Объявления, Помощь",
  });
  const [newCat, setNewCat] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const load = async () => {
    const { data: f } = await supabase.from("sub_forums" as any).select("*").order("created_at");
    setForums((f as any) || []);
    const { data: c } = await supabase.from("sub_forum_categories" as any).select("*").order("order_position");
    const grouped: Record<string, SubForumCategory[]> = {};
    ((c as any) || []).forEach((row: SubForumCategory) => {
      (grouped[row.sub_forum_id] ||= []).push(row);
    });
    setCats(grouped);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim()) { toast({ title: "Введите название", variant: "destructive" }); return; }
    setCreating(true);
    try {
      const slug = slugify(form.name);
      const { data: created, error } = await (supabase.from("sub_forums" as any).insert({
        slug, name: form.name, description: form.description || null,
        primary_color: form.primary_color, accent_color: form.accent_color,
        bg_color: form.bg_color, card_bg: form.card_bg,
      }).select().single() as any);
      if (error) throw error;

      const initial = form.initial_categories.split(",").map(s => s.trim()).filter(Boolean);
      if (initial.length) {
        await supabase.from("sub_forum_categories" as any).insert(
          initial.map((name, i) => ({
            sub_forum_id: (created as any).id,
            slug: slugify(name) || `cat-${i+1}`,
            name, order_position: i,
          }))
        );
      }
      toast({ title: "Подфорум создан", description: `/f/${slug}` });
      setForm({ ...form, name: "", description: "" });
      await load();
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    } finally { setCreating(false); }
  };

  const addCat = async (forumId: string) => {
    const name = newCat[forumId]?.trim();
    if (!name) return;
    const { error } = await supabase.from("sub_forum_categories" as any).insert({
      sub_forum_id: forumId, slug: slugify(name), name,
    });
    if (error) { toast({ title: "Ошибка", description: error.message, variant: "destructive" }); return; }
    setNewCat({ ...newCat, [forumId]: "" });
    await load();
  };

  const toggleActive = async (f: SubForum) => {
    await supabase.from("sub_forums" as any).update({ is_active: !f.is_active }).eq("id", f.id);
    load();
  };

  const removeCat = async (id: string) => {
    await supabase.from("sub_forum_categories" as any).delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5"/>Создать подфорум</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label>Название</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Game Forum"/></div>
            <div><Label>Описание</Label><Input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}/></div>
            <div><Label>Основной цвет</Label><Input type="color" value={form.primary_color} onChange={(e) => setForm({...form, primary_color: e.target.value})}/></div>
            <div><Label>Акцентный цвет</Label><Input type="color" value={form.accent_color} onChange={(e) => setForm({...form, accent_color: e.target.value})}/></div>
            <div><Label>Фон</Label><Input type="color" value={form.bg_color} onChange={(e) => setForm({...form, bg_color: e.target.value})}/></div>
            <div><Label>Фон карточек</Label><Input type="color" value={form.card_bg} onChange={(e) => setForm({...form, card_bg: e.target.value})}/></div>
          </div>
          <div>
            <Label>Начальные разделы (через запятую)</Label>
            <Textarea rows={2} value={form.initial_categories} onChange={(e) => setForm({...form, initial_categories: e.target.value})}/>
          </div>
          <Button onClick={create} disabled={creating}>{creating ? "Создание..." : "Создать"}</Button>
        </CardContent>
      </Card>

      {forums.map((f) => (
        <Card key={f.id} style={{ borderLeft: `4px solid ${f.primary_color}` }}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
              <span>{f.name} <Badge variant="outline">/f/{f.slug}</Badge></span>
              <Button size="sm" variant={f.is_active ? "default" : "outline"} onClick={() => toggleActive(f)}>
                {f.is_active ? "Активен" : "Скрыт"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {f.description && <p className="text-sm text-muted-foreground">{f.description}</p>}
            <div className="space-y-1">
              {(cats[f.id] || []).map(c => (
                <div key={c.id} className="flex items-center justify-between p-2 border rounded text-sm">
                  <span>📁 {c.name} <span className="text-muted-foreground">/{c.slug}</span></span>
                  <Button size="sm" variant="ghost" onClick={() => removeCat(c.id)}><Trash2 className="h-3 w-3"/></Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Новый раздел..." value={newCat[f.id] || ""} onChange={(e) => setNewCat({...newCat, [f.id]: e.target.value})}/>
              <Button size="sm" onClick={() => addCat(f.id)}><FolderPlus className="h-4 w-4 mr-1"/>Добавить</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminSubForumsTab;
