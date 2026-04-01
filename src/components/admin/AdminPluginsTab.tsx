import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Puzzle, Plus, Eye, EyeOff, Edit, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const HOOK_POINTS = [
  { value: "forum_top", label: "Форум — сверху" },
  { value: "forum_bottom", label: "Форум — снизу" },
  { value: "topic_top", label: "Тема — сверху" },
  { value: "topic_bottom", label: "Тема — снизу" },
  { value: "profile_top", label: "Профиль — сверху" },
  { value: "sidebar", label: "Сайдбар" },
  { value: "header", label: "Хедер" },
  { value: "footer", label: "Футер" },
];

export default function AdminPluginsTab() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [author, setAuthor] = useState("");
  const [code, setCode] = useState("");
  const [hookPoints, setHookPoints] = useState<string[]>([]);
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

  const resetForm = () => {
    setName("");
    setDescription("");
    setVersion("1.0.0");
    setAuthor("");
    setCode("");
    setHookPoints([]);
    setEditingId(null);
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
      hook_points: hookPoints.length > 0 ? hookPoints : null,
      created_by: user?.id,
    } as any);

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Плагин создан" });
    setShowCreate(false);
    resetForm();
    loadPlugins();
  };

  const startEditing = (plugin: Plugin) => {
    setEditingId(plugin.id);
    setName(plugin.name);
    setDescription(plugin.description || "");
    setVersion(plugin.version || "1.0.0");
    setAuthor(plugin.author || "");
    setCode(plugin.code || "");
    setHookPoints(plugin.hook_points || []);
  };

  const savePlugin = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from("forum_plugins")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        version,
        author: author.trim() || null,
        code: code.trim() || null,
        hook_points: hookPoints.length > 0 ? hookPoints : null,
      } as any)
      .eq("id", editingId);

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Плагин обновлён" });
    resetForm();
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

  const toggleHookPoint = (hp: string) => {
    setHookPoints(prev =>
      prev.includes(hp) ? prev.filter(h => h !== hp) : [...prev, hp]
    );
  };

  const PluginForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
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
        <Label>Точки подключения (hook points)</Label>
        <div className="flex flex-wrap gap-2">
          {HOOK_POINTS.map(hp => (
            <Badge
              key={hp.value}
              variant={hookPoints.includes(hp.value) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleHookPoint(hp.value)}
            >
              {hp.label}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Если не выбрано — плагин работает везде</p>
      </div>
      <div className="space-y-2">
        <Label>Код плагина</Label>
        <p className="text-xs text-muted-foreground">
          Форматы: JSON {`{"html":"...","css":"...","js":"..."}`} или сырой HTML/CSS/JS (с тегами {`<style>`}, {`<script>`})
        </p>
        <Textarea value={code} onChange={e => setCode(e.target.value)} placeholder={'<style>.my-banner { background: #333; padding: 16px; }</style>\n<div class="my-banner">Привет!</div>\n<script>console.log("Plugin loaded")</script>'} className="font-mono min-h-[200px] text-xs" />
      </div>
      <Button onClick={onSubmit} className="w-full">{submitLabel}</Button>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Puzzle className="h-5 w-5" />
            Плагины
          </div>
          <Dialog open={showCreate} onOpenChange={(o) => { setShowCreate(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Создать плагин</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Новый плагин</DialogTitle>
              </DialogHeader>
              <PluginForm onSubmit={createPlugin} submitLabel="Создать" />
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
              <div key={plugin.id}>
                {editingId === plugin.id ? (
                  <div className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Редактирование: {plugin.name}</span>
                      <Button size="sm" variant="ghost" onClick={() => { resetForm(); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <PluginForm onSubmit={savePlugin} submitLabel="Сохранить" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{plugin.name}</span>
                        <Badge variant={plugin.is_active ? "default" : "secondary"}>
                          {plugin.is_active ? "Активен" : "Скрыт"}
                        </Badge>
                        {plugin.version && <span className="text-xs text-muted-foreground">v{plugin.version}</span>}
                      </div>
                      {plugin.description && <p className="text-sm text-muted-foreground mt-1">{plugin.description}</p>}
                      {plugin.author && <p className="text-xs text-muted-foreground">Автор: {plugin.author}</p>}
                      {plugin.hook_points && plugin.hook_points.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {plugin.hook_points.map(hp => (
                            <Badge key={hp} variant="outline" className="text-xs">{hp}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEditing(plugin)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePlugin(plugin.id, plugin.is_active)}
                      >
                        {plugin.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
