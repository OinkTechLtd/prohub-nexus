import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Copy, ExternalLink, ShieldCheck } from "lucide-react";

/**
 * Кросс-доменная передача сессии.
 *
 * Источник (текущий домен) экспортирует access_token + refresh_token
 * в URL-фрагмент (#at=...&rt=...) и редиректит на целевой домен на /auth/handoff.
 * Целевой домен парсит фрагмент и вызывает supabase.auth.setSession — пользователь
 * залогинен без повторного ввода пароля. Токены лежат только во fragment
 * (никогда не уходят на сервер) и удаляются из URL сразу после применения.
 */
const KNOWN_DOMAINS = [
  "prohub-nexus.lovable.app",
  "prohubforumru.tatnet.app",
];

const AuthHandoff = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "applying" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [targetDomain, setTargetDomain] = useState<string>("");
  const [link, setLink] = useState<string>("");
  const [hasSession, setHasSession] = useState<boolean>(false);

  // Apply tokens from fragment on mount
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const at = params.get("at");
    const rt = params.get("rt");
    if (at && rt) {
      setStatus("applying");
      supabase.auth
        .setSession({ access_token: at, refresh_token: rt })
        .then(({ error }) => {
          // Always strip tokens from URL
          history.replaceState(null, "", window.location.pathname);
          if (error) {
            setError(error.message);
            setStatus("error");
            return;
          }
          setStatus("done");
          toast({ title: "Вход выполнен", description: "Сессия перенесена с другого домена." });
          setTimeout(() => navigate("/", { replace: true }), 800);
        });
    }
  }, [navigate]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    const def = KNOWN_DOMAINS.find((d) => d !== window.location.host) || "";
    setTargetDomain(def);
  }, []);

  const generate = async () => {
    const { data } = await supabase.auth.getSession();
    const s = data.session;
    if (!s) {
      toast({ title: "Нет активной сессии", variant: "destructive" });
      return;
    }
    const host = (targetDomain || "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!host) {
      toast({ title: "Укажи домен", variant: "destructive" });
      return;
    }
    const url = `https://${host}/auth/handoff#at=${encodeURIComponent(s.access_token)}&rt=${encodeURIComponent(s.refresh_token)}`;
    setLink(url);
  };

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast({ title: "Ссылка скопирована" });
  };

  if (status === "applying") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-2">
            <ShieldCheck className="h-10 w-10 mx-auto text-primary" />
            <p>Переносим сессию...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 space-y-3">
            <p className="text-destructive font-semibold">Не удалось перенести сессию</p>
            <p className="text-sm text-muted-foreground break-words">{error}</p>
            <Button onClick={() => navigate("/auth")}>Войти заново</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Перенос сессии между доменами
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Сгенерируй одноразовую ссылку, открой её на другом зеркале форума —
            и сразу окажешься залогинен под тем же аккаунтом. Токены передаются
            в URL-фрагменте и нигде не сохраняются на сервере.
          </p>
          {!hasSession && (
            <p className="text-sm text-amber-500">Сначала войди в аккаунт на этом домене.</p>
          )}
          <div className="space-y-2">
            <Label>Целевой домен (без https://)</Label>
            <Input
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              placeholder="prohubforumru.tatnet.app"
            />
            <div className="flex flex-wrap gap-1.5">
              {KNOWN_DOMAINS.filter((d) => d !== window.location.host).map((d) => (
                <Button key={d} size="sm" variant="outline" onClick={() => setTargetDomain(d)}>
                  {d}
                </Button>
              ))}
            </div>
          </div>
          <Button onClick={generate} disabled={!hasSession}>
            Сгенерировать ссылку
          </Button>
          {link && (
            <div className="space-y-2">
              <div className="p-3 rounded-md border bg-muted/40 text-xs break-all">{link}</div>
              <div className="flex gap-2">
                <Button size="sm" onClick={copy}><Copy className="h-3.5 w-3.5 mr-1" />Копировать</Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={link} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />Открыть
                  </a>
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Ссылка действительна, пока действует твой текущий access_token (около часа).
                Никому её не показывай — это эквивалент входа в аккаунт.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthHandoff;
