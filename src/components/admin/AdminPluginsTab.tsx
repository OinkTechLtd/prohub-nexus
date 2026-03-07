import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Puzzle, Plus, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Plugin {
  id: string;
  name: string;
  description: string | null;
  version: string | null;
  author: string | null;
  is_active: boolean;
  code: string | null;
  hook_points: string[];
  created_at: string;
}

export default function AdminPluginsTab() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [author, setAuthor] = useState("");
  const [code, setCode] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    const { data } = await supabase
      .from("forum_plugins")
      .select("*")
      .order("created_at", { ascending: false });
    setPlugins((data as any[]) || []);
    setLoading(false);
  };

  const createPlugin = async () => {
    if (!name.trim()) {
      toast({ title: "Введите название плагина", variant: "destructive" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("forum_plugins").insert({
      name: name.trim(),
      description: description.trim() || null,
      version,
      author: author.trim() || null,
      code: code.trim() || null,
      created_by: user?.id,
    } as any);

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Плагин создан" });
    setShowCreate(false);
    setName("");
    setDescription("");
    setCode("");
    setAuthor("");
    loadPlugins();
  };

  const togglePlugin = async (id: string, currentActive: boolean) => {
    await supabase
      .from("forum_plugins")
      .update({ is_active: !currentActive } as any)
      .eq("id", id);
    setPlugins(plugins.map(p => p.id === id ? { ...p, is_active: !currentActive } : p));
    toast({ title: currentActive ? "Плагин скрыт" : "Плагин активирован" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Puzzle className="h-5 w-5" />
            Плагины
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Создать плагин</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Новый плагин</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Название</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Мой плагин" />
                  </div>
                  <div className="space-y-2">
                    <Label>Версия</Label>
                    <Input value={version} onChange={e => setVersion(e.target.value)} placeholder="1.0.0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Автор</Label>
                  <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Имя автора" />
                </div>
                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Описание плагина..." />
                </div>
                <div className="space-y-2">
                  <Label>Код плагина (JS/JSON)</Label>
                  <Textarea value={code} onChange={e => setCode(e.target.value)} placeholder='{"hooks": [...]}' className="font-mono min-h-[150px]" />
                </div>
                <Button onClick={createPlugin} className="w-full">Создать</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Загрузка...</p>
        ) : plugins.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Плагинов пока нет</p>
        ) : (
          <div className="space-y-3">
            {plugins.map(plugin => (
              <div key={plugin.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{plugin.name}</span>
                    <Badge variant={plugin.is_active ? "default" : "secondary"}>
                      {plugin.is_active ? "Активен" : "Скрыт"}
                    </Badge>
                    {plugin.version && <span className="text-xs text-muted-foreground">v{plugin.version}</span>}
                  </div>
                  {plugin.description && <p className="text-sm text-muted-foreground mt-1">{plugin.description}</p>}
                  {plugin.author && <p className="text-xs text-muted-foreground">Автор: {plugin.author}</p>}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => togglePlugin(plugin.id, plugin.is_active)}
                >
                  {plugin.is_active ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {plugin.is_active ? "Скрыть" : "Показать"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
