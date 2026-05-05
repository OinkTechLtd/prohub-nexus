import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SubForumHeader from "@/components/SubForumHeader";

const PAGE = 20;

const SubForumSearchPage = () => {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [forum, setForum] = useState<any>(null);
  const [cats, setCats] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const q = params.get("q") || "";
  const catId = params.get("cat") || "";
  const page = parseInt(params.get("p") || "1", 10);

  useEffect(() => {
    (async () => {
      const { data: f } = await supabase.from("sub_forums" as any).select("*").eq("slug", slug).maybeSingle();
      setForum(f);
      if (f) {
        const { data: c } = await supabase.from("sub_forum_categories" as any).select("id,slug,name").eq("sub_forum_id", (f as any).id).order("order_position");
        setCats((c as any) || []);
      }
    })();
  }, [slug]);

  useEffect(() => {
    if (!forum || !q.trim() || q.trim().length < 2) { setResults([]); setTotal(0); return; }
    setLoading(true);
    (async () => {
      const from = (page - 1) * PAGE;
      let query = supabase.from("sub_forum_topics" as any)
        .select("id,title,content,created_at,category_id,user_id", { count: "exact" })
        .eq("sub_forum_id", forum.id)
        .eq("is_hidden", false)
        .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE - 1);
      if (catId) query = query.eq("category_id", catId);
      const { data, count } = await query;
      setResults((data as any) || []);
      setTotal(count || 0);
      setLoading(false);
    })();
  }, [forum, q, catId, page]);

  if (!forum) return <div className="p-8 text-center text-white">Загрузка...</div>;
  const totalPages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="min-h-screen text-white" style={{ background: forum.bg_color }}>
      <SubForumHeader forum={forum} />
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-4xl">
        <Link to={`/f/${slug}`} className="text-xs text-white/50 hover:underline">← {forum.name}</Link>
        <h1 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: forum.primary_color }}>Поиск</h1>

        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <Input
            defaultValue={q}
            placeholder="Поиск по темам..."
            className="bg-white/5 border-white/10 text-white"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = (e.target as HTMLInputElement).value;
                setParams({ q: v, ...(catId ? { cat: catId } : {}), p: "1" });
              }
            }}
          />
          <select
            value={catId}
            onChange={(e) => setParams({ q, ...(e.target.value ? { cat: e.target.value } : {}), p: "1" })}
            className="h-10 rounded-md px-2 text-sm bg-white/5 border border-white/10 text-white sm:w-56"
          >
            <option value="" className="text-black">Все разделы</option>
            {cats.map((c) => <option key={c.id} value={c.id} className="text-black">{c.name}</option>)}
          </select>
        </div>

        {q && cats.length > 0 && (
          <div className="flex gap-1.5 mb-3 flex-wrap">
            <button onClick={() => setParams({ q, p: "1" })} className={`text-[11px] px-2 py-1 rounded ${!catId ? "bg-white/20" : "bg-white/5"}`}>Все</button>
            {cats.map(c => (
              <button key={c.id} onClick={() => setParams({ q, cat: c.id, p: "1" })} className={`text-[11px] px-2 py-1 rounded ${catId === c.id ? "bg-white/20" : "bg-white/5"}`}>{c.name}</button>
            ))}
          </div>
        )}

        {!q ? (
          <p className="text-white/60">Введите запрос для поиска.</p>
        ) : loading ? (
          <p className="text-white/60">Поиск...</p>
        ) : results.length === 0 ? (
          <p className="text-white/60">Ничего не найдено.</p>
        ) : (
          <>
            <p className="text-xs text-white/50 mb-2">Найдено: {total}</p>
            <div className="space-y-2">
              {results.map((r) => (
                <Card key={r.id} className="cursor-pointer border-0" style={{ background: forum.card_bg }} onClick={() => navigate(`/f/${slug}/t/${r.id}`)}>
                  <CardContent className="p-3">
                    <div className="font-medium text-sm sm:text-base truncate" style={{ color: forum.primary_color }}>{r.title}</div>
                    <div className="text-xs text-white/60 line-clamp-2 mt-1">{(r.content || "").replace(/\[\/?[a-z0-9=]+\]/gi, "").slice(0, 200)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setParams({ q, ...(catId ? { cat: catId } : {}), p: String(page - 1) })} className="border-white/20 text-white">←</Button>
                <span className="text-xs self-center text-white/70">{page} / {totalPages}</span>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setParams({ q, ...(catId ? { cat: catId } : {}), p: String(page + 1) })} className="border-white/20 text-white">→</Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SubForumSearchPage;
