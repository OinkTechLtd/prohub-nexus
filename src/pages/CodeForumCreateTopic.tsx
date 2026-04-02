import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CodeForumHeader from "@/components/CodeForumHeader";
import BBCodeToolbar from "@/components/BBCodeToolbar";
import { useToast } from "@/hooks/use-toast";

const CodeForumCreateTopic = () => {
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { navigate("/auth"); return; }
      setUser(session.user);
    });
  }, []);

  useEffect(() => {
    loadCategories();
    if (location.state?.categoryId) setCategoryId(location.state.categoryId);
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .eq("forum_id", "codeforum")
      .order("order_position");
    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim() || !categoryId) return;

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: moderationResult } = await supabase.functions.invoke("moderate-content", {
        body: { content: title + " " + content, type: "topic" },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (moderationResult && !moderationResult.approved) {
        toast({ title: "Неприемлемый контент", description: moderationResult.reason, variant: "destructive" });
        setSubmitting(false);
        return;
      }

      const { data: newTopic, error } = await supabase
        .from("topics")
        .insert({ title: title.trim(), content: content.trim(), category_id: categoryId, user_id: user.id })
        .select("id")
        .single();

      if (error) throw error;
      navigate(`/codeforum/topic/${newTopic.id}`);
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-gray-200">
      <CodeForumHeader user={user} />

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <h1 className="text-xl font-bold text-white mb-6">Создать тему</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Категория</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-[#16213e] border border-[#1a1a3e] rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
              required
            >
              <option value="">Выберите категорию</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Заголовок</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#16213e] border border-[#1a1a3e] rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500"
              placeholder="Заголовок темы"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Содержание</label>
            <BBCodeToolbar
              onInsert={(before, after) => {
                const textarea = document.getElementById("cf-content") as HTMLTextAreaElement;
                if (!textarea) return;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const selected = content.substring(start, end);
                setContent(content.substring(0, start) + before + selected + after + content.substring(end));
              }}
            />
            <textarea
              id="cf-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full bg-[#16213e] border border-[#1a1a3e] rounded-b px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 resize-y min-h-[200px]"
              placeholder="Содержание темы..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
          >
            {submitting ? "Создание..." : "Создать тему"}
          </button>
        </form>
      </main>
    </div>
  );
};

export default CodeForumCreateTopic;
