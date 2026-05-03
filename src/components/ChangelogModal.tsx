import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const KEY = "prohub_changelog_seen_v";

const ChangelogModal = () => {
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("forum_settings").select("key,value").in("key", ["changelog_version", "changelog_content"]);
      if (!data) return;
      const v = data.find(d => d.key === "changelog_version")?.value || "";
      const c = data.find(d => d.key === "changelog_content")?.value || "";
      if (!v) return;
      const seen = localStorage.getItem(KEY);
      if (seen !== v) {
        setVersion(v); setContent(c); setOpen(true);
      }
    })();
  }, []);

  const close = () => { localStorage.setItem(KEY, version); setOpen(false); };

  const items = content.split("\n").map(s => s.trim()).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Что нового</DialogTitle>
          <DialogDescription>Обновление #{version}</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2"><span className="text-primary">•</span><span>{it}</span></li>
          ))}
        </ul>
        <DialogFooter>
          <Button onClick={close}>Понятно</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChangelogModal;
