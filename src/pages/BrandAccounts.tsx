import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Plus, Trash2, ExternalLink, Loader2, Upload, ImageIcon, Check, UserCircle } from "lucide-react";
import { useActiveBrand } from "@/hooks/useActiveBrand";

interface BrandAccount {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  website_url: string | null;
  link_label: string | null;
  is_verified: boolean;
  created_at: string;
}

const MAX_BRANDS = 20;
const MAX_FILE_MB = 5;

export default function BrandAccounts() {
  const [user, setUser] = useState<any>(null);
  const [brands, setBrands] = useState<BrandAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    handle: "",
    description: "",
    website_url: "",
    link_label: "",
  });
  const navigate = useNavigate();
  const { activeBrandId, setActiveBrandId } = useActiveBrand();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      await loadBrands(session.user.id);
    })();
  }, []);

  const loadBrands = async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("brand_accounts")
      .select("*")
      .eq("owner_user_id", uid)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Не удалось загрузить аккаунты бренда");
    } else {
      setBrands((data as BrandAccount[]) || []);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (brands.length >= MAX_BRANDS) {
      toast.error(`Лимит ${MAX_BRANDS} аккаунтов бренда достигнут`);
      return;
    }
    const handle = form.handle.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!form.name.trim() || !handle) {
      toast.error("Заполните имя и handle");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("brand_accounts").insert({
      owner_user_id: user.id,
      name: form.name.trim(),
      handle,
      description: form.description.trim() || null,
      website_url: form.website_url.trim() || null,
      link_label: form.link_label.trim() || null,
    });
    setCreating(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Handle уже занят" : error.message);
      return;
    }
    toast.success("Аккаунт бренда создан");
    setForm({ name: "", handle: "", description: "", website_url: "", link_label: "" });
    await loadBrands(user.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить аккаунт бренда? Действие необратимо.")) return;
    if (activeBrandId === id) setActiveBrandId(null);
    const { error } = await supabase.from("brand_accounts").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Удалено");
    if (user) await loadBrands(user.id);
  };

  const handleMediaUpload = async (
    brand: BrandAccount,
    kind: "avatar" | "cover",
    file: File
  ) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Файл должен быть изображением");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Размер файла не должен превышать ${MAX_FILE_MB} МБ`);
      return;
    }
    setUploadingId(`${brand.id}-${kind}`);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/brands/${brand.id}/${kind}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("profile-covers")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("profile-covers").getPublicUrl(path);
      const column = kind === "avatar" ? "avatar_url" : "cover_url";
      const { error: updErr } = await supabase
        .from("brand_accounts")
        .update({ [column]: publicUrl })
        .eq("id", brand.id);
      if (updErr) throw updErr;
      toast.success(kind === "avatar" ? "Аватарка обновлена" : "Обложка обновлена");
      await loadBrands(user.id);
    } catch (e: any) {
      toast.error(`Ошибка загрузки: ${e.message || "неизвестная ошибка"}`);
    } finally {
      setUploadingId(null);
    }
  };

  const handleSwitchBrand = (brand: BrandAccount | null) => {
    if (brand) {
      setActiveBrandId(brand.id);
      toast.success(`Активен бренд: ${brand.name}`);
    } else {
      setActiveBrandId(null);
      toast.success("Вернулись на личный аккаунт");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-7 w-7 text-primary" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Аккаунты бренда</h1>
            <p className="text-sm text-muted-foreground">
              {brands.length} / {MAX_BRANDS} — как организации на GitHub
            </p>
          </div>
          {activeBrandId && (
            <Button variant="outline" size="sm" onClick={() => handleSwitchBrand(null)}>
              <UserCircle className="h-4 w-4 mr-1" /> На личный
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" /> Создать новый аккаунт
            </CardTitle>
            <CardDescription>
              После создания загрузите аватарку и обложку ниже.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name">Название</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Brand Inc." maxLength={60} required />
                </div>
                <div>
                  <Label htmlFor="handle">Handle</Label>
                  <Input id="handle" value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} placeholder="my-brand" maxLength={30} required />
                </div>
              </div>
              <div>
                <Label htmlFor="desc">Описание</Label>
                <Textarea id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Кратко о бренде" maxLength={500} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="website">Ссылка</Label>
                  <Input id="website" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="https://your-site.com" />
                </div>
                <div>
                  <Label htmlFor="label">Подпись ссылки</Label>
                  <Input id="label" value={form.link_label} onChange={(e) => setForm({ ...form, link_label: e.target.value })} placeholder="Наш сайт" maxLength={40} />
                </div>
              </div>
              <Button type="submit" disabled={creating || brands.length >= MAX_BRANDS}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Создать
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Мои бренды</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : brands.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Пока нет аккаунтов бренда</p>
          ) : (
            brands.map((b) => {
              const isActive = activeBrandId === b.id;
              return (
                <Card key={b.id} className={isActive ? "border-primary" : ""}>
                  {b.cover_url && (
                    <div
                      className="h-24 rounded-t-lg bg-cover bg-center"
                      style={{ backgroundImage: `url(${b.cover_url})` }}
                    />
                  )}
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={b.avatar_url || undefined} />
                        <AvatarFallback>{b.name[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold truncate">{b.name}</span>
                          <Badge variant="secondary" className="text-xs">@{b.handle}</Badge>
                          {b.is_verified && <Badge className="text-xs">✓ Verified</Badge>}
                          {isActive && <Badge variant="default" className="text-xs">Активный</Badge>}
                        </div>
                        {b.description && <p className="text-sm text-muted-foreground mt-1">{b.description}</p>}
                        {b.website_url && (
                          <a href={b.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2">
                            <ExternalLink className="h-3 w-3" />
                            {b.link_label || b.website_url}
                          </a>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)} aria-label="Удалить">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => e.target.files?.[0] && handleMediaUpload(b, "avatar", e.target.files[0])}
                        />
                        <span className="inline-flex items-center justify-center gap-1 w-full text-xs h-9 rounded-md border border-input hover:bg-accent">
                          {uploadingId === `${b.id}-avatar` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                          Аватарка
                        </span>
                      </label>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => e.target.files?.[0] && handleMediaUpload(b, "cover", e.target.files[0])}
                        />
                        <span className="inline-flex items-center justify-center gap-1 w-full text-xs h-9 rounded-md border border-input hover:bg-accent">
                          {uploadingId === `${b.id}-cover` ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                          Обложка
                        </span>
                      </label>
                      <Button
                        size="sm"
                        variant={isActive ? "secondary" : "default"}
                        onClick={() => handleSwitchBrand(isActive ? null : b)}
                        className="text-xs"
                      >
                        {isActive ? <><Check className="h-3 w-3 mr-1" /> Активен</> : "Сделать активным"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
