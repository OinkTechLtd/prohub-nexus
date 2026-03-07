import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FolderOpen, Plus, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order_position: number | null;
}

export default function AdminSectionsTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("order_position", { ascending: true });
    setCategories(data || []);
    setLoading(false);
  };

  const createCategory = async () => {
    if (!name.trim() || !slug.trim()) {
      toast({ title: "Заполните название и slug", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("categories").insert({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      icon: icon.trim() || null,
      order_position: categories.length,
    });

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Раздел создан" });
    setShowCreate(false);
    setName("");
    setSlug("");
    setDescription("");
    setIcon("");
    loadCategories();
  };

  const updateOrder = async (id: string, direction: "up" | "down") => {
    const idx = categories.findIndex(c => c.id === id);
    if ((direction === "up" && idx === 0) || (direction === "down" && idx === categories.length - 1)) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...categories];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];

    await Promise.all([
      supabase.from("categories").update({ order_position: idx }).eq("id", updated[idx].id),
      supabase.from("categories").update({ order_position: swapIdx }).eq("id", updated[swapIdx].id),
    ]);

    setCategories(updated.map((c, i) => ({ ...c, order_position: i })));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Разделы форума
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Создать раздел</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новый раздел</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Название</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Общение" />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL)</Label>
                  <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="general" />
                </div>
                <div className="space-y-2">
                  <Label>Иконка (emoji)</Label>
                  <Input value={icon} onChange={e => setIcon(e.target.value)} placeholder="💬" />
                </div>
                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Описание раздела..." />
                </div>
                <Button onClick={createCategory} className="w-full">Создать</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Загрузка...</p>
        ) : categories.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Разделов пока нет</p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat, idx) => (
              <div key={cat.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => updateOrder(cat.id, "up")} disabled={idx === 0}>▲</Button>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => updateOrder(cat.id, "down")} disabled={idx === categories.length - 1}>▼</Button>
                </div>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg">{cat.icon || "📁"}</span>
                <div className="flex-1">
                  <div className="font-medium">{cat.name}</div>
                  {cat.description && <p className="text-sm text-muted-foreground">{cat.description}</p>}
                  <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                </div>
                <Badge variant="outline">#{(cat.order_position ?? idx) + 1}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
