import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Layout, Plus, Eye, EyeOff } from "lucide-react";
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

interface Template {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  html_content: string | null;
  css_content: string | null;
  is_active: boolean;
  template_type: string | null;
  created_at: string;
}

export default function AdminTemplatesTab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [cssContent, setCssContent] = useState("");
  const [templateType, setTemplateType] = useState("page");
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const { data } = await supabase
      .from("forum_templates")
      .select("*")
      .order("created_at", { ascending: false });
    setTemplates((data as any[]) || []);
    setLoading(false);
  };

  const createTemplate = async () => {
    if (!name.trim() || !slug.trim()) {
      toast({ title: "Заполните название и slug", variant: "destructive" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("forum_templates").insert({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      html_content: htmlContent.trim() || null,
      css_content: cssContent.trim() || null,
      template_type: templateType,
      created_by: user?.id,
    } as any);

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Шаблон создан" });
    setShowCreate(false);
    setName("");
    setSlug("");
    setDescription("");
    setHtmlContent("");
    setCssContent("");
    loadTemplates();
  };

  const toggleTemplate = async (id: string, currentActive: boolean) => {
    await supabase
      .from("forum_templates")
      .update({ is_active: !currentActive } as any)
      .eq("id", id);
    setTemplates(templates.map(t => t.id === id ? { ...t, is_active: !currentActive } : t));
    toast({ title: currentActive ? "Шаблон скрыт" : "Шаблон активирован" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Шаблоны
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Создать шаблон</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Новый шаблон</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Название</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Главная страница" />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="main-page" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Тип</Label>
                  <Select value={templateType} onValueChange={setTemplateType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="page">Страница</SelectItem>
                      <SelectItem value="widget">Виджет</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="header">Хедер</SelectItem>
                      <SelectItem value="footer">Футер</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Описание шаблона..." />
                </div>
                <div className="space-y-2">
                  <Label>HTML</Label>
                  <Textarea value={htmlContent} onChange={e => setHtmlContent(e.target.value)} placeholder="<div>...</div>" className="font-mono min-h-[120px]" />
                </div>
                <div className="space-y-2">
                  <Label>CSS</Label>
                  <Textarea value={cssContent} onChange={e => setCssContent(e.target.value)} placeholder=".class { ... }" className="font-mono min-h-[80px]" />
                </div>
                <Button onClick={createTemplate} className="w-full">Создать</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Загрузка...</p>
        ) : templates.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Шаблонов пока нет</p>
        ) : (
          <div className="space-y-3">
            {templates.map(template => (
              <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{template.name}</span>
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Активен" : "Скрыт"}
                    </Badge>
                    <Badge variant="outline">{template.template_type}</Badge>
                  </div>
                  {template.description && <p className="text-sm text-muted-foreground mt-1">{template.description}</p>}
                  <p className="text-xs text-muted-foreground">slug: {template.slug}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleTemplate(template.id, template.is_active)}
                >
                  {template.is_active ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {template.is_active ? "Скрыть" : "Показать"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
