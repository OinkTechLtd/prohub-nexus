import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface Cat { id: string; slug: string; name: string }
interface Props {
  forum: { id: string; slug: string; primary_color: string; card_bg: string };
  categories: Cat[];
  defaultCategoryId?: string;
}

const SubForumSearch = ({ forum, categories, defaultCategoryId }: Props) => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [catId, setCatId] = useState<string>(defaultCategoryId || "");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      let query = supabase.from("sub_forum_topics" as any)
        .select("id,title,category_id,created_at")
        .eq("sub_forum_id", forum.id)
        .eq("is_hidden", false)
        .or(`title.ilike.%${term}%,content.ilike.%${term}%`)
        .order("created_at", { ascending: false })
        .limit(15);
      if (catId) query = query.eq("category_id", catId);
      const { data } = await query;
      setResults((data as any) || []);
      setLoading(false);
      setOpen(true);
    }, 250);
    return () => clearTimeout(t);
  }, [q, catId, forum.id]);

  return (
    <div className="relative mb-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
            placeholder="Поиск по темам..."
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
          {q && (
            <button onClick={() => { setQ(""); setResults([]); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {categories.length > 0 && (
          <select
            value={catId}
            onChange={(e) => setCatId(e.target.value)}
            className="h-10 rounded-md px-2 text-sm bg-white/5 border border-white/10 text-white sm:w-48"
          >
            <option value="" className="text-black">Все разделы</option>
            {categories.map(c => <option key={c.id} value={c.id} className="text-black">{c.name}</option>)}
          </select>
        )}
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute z-30 left-0 right-0 mt-1 rounded-md border border-white/10 shadow-xl max-h-80 overflow-y-auto" style={{ background: forum.card_bg }}>
          {loading ? (
            <div className="p-3 text-sm text-white/60">Поиск...</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-white/60">Ничего не найдено</div>
          ) : results.map(r => (
            <button
              key={r.id}
              onClick={() => { navigate(`/f/${forum.slug}/t/${r.id}`); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 text-white border-b border-white/5 last:border-0"
            >
              <div className="truncate" style={{ color: forum.primary_color }}>{r.title}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubForumSearch;
