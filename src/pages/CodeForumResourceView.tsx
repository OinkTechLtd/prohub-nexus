import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, ExternalLink, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import CodeForumHeader from "@/components/CodeForumHeader";
import StyledUsername from "@/components/StyledUsername";
import { LikeButton } from "@/components/LikeButton";
import { StarRating } from "@/components/StarRating";

interface Resource {
  id: string;
  title: string;
  description: string;
  resource_type: string;
  url: string | null;
  file_url: string | null;
  downloads: number;
  rating: number;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
    username_css: string | null;
  } | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string | null;
    username_css: string | null;
  } | null;
}

const CodeForumResourceView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!id) return;

    const loadAll = async () => {
      try {
        const [{ data: resourceData }, { data: commentsData }] = await Promise.all([
          supabase
            .from("resources")
            .select("id, title, description, resource_type, url, file_url, downloads, rating, created_at, user_id, profiles!resources_user_id_fkey(username, avatar_url, username_css)")
            .eq("id", id)
            .eq("is_hidden", false)
            .single(),
          supabase
            .from("resource_comments")
            .select("id, content, created_at, user_id, profiles!resource_comments_user_id_fkey(username, avatar_url, username_css)")
            .eq("resource_id", id)
            .eq("is_hidden", false)
            .order("created_at", { ascending: true }),
        ]);

        setResource((resourceData as Resource) || null);
        setComments((commentsData as Comment[]) || []);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;

    const loadUserRating = async () => {
      const { data } = await supabase
        .from("resource_ratings")
        .select("rating")
        .eq("resource_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.rating) setUserRating(data.rating);
    };

    loadUserRating();
  }, [id, user]);

  const reloadComments = async () => {
    const { data } = await supabase
      .from("resource_comments")
      .select("id, content, created_at, user_id, profiles!resource_comments_user_id_fkey(username, avatar_url, username_css)")
      .eq("resource_id", id)
      .eq("is_hidden", false)
      .order("created_at", { ascending: true });

    setComments((data as Comment[]) || []);
  };

  const handleRate = async (rating: number) => {
    if (!user || !id || ratingSubmitting) return;
    setRatingSubmitting(true);
    try {
      await supabase.from("resource_ratings").upsert({ resource_id: id, user_id: user.id, rating }, { onConflict: "resource_id,user_id" });
      setUserRating(rating);
      const { data } = await supabase.from("resources").select("rating").eq("id", id).single();
      setResource((prev) => prev ? { ...prev, rating: data?.rating || prev.rating } : prev);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleOpenResource = async () => {
    if (!resource) return;
    const target = resource.file_url || resource.url;
    if (target) window.open(target, "_blank");
    const nextDownloads = (resource.downloads || 0) + 1;
    await supabase.from("resources").update({ downloads: nextDownloads }).eq("id", resource.id);
    setResource({ ...resource, downloads: nextDownloads });
  };

  const handleSubmitComment = async () => {
    if (!user || !id || !newComment.trim()) return;
    setSubmitting(true);
    try {
      await supabase.from("resource_comments").insert({ resource_id: id, user_id: user.id, content: newComment.trim() });
      setNewComment("");
      await reloadComments();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from("resource_comments").delete().eq("id", commentId).eq("user_id", user?.id);
    await reloadComments();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] text-gray-200">
        <CodeForumHeader user={user} />
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">Загрузка ресурса...</div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] text-gray-200">
        <CodeForumHeader user={user} />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="mb-4 text-gray-400">Ресурс не найден</p>
          <button onClick={() => navigate("/codeforum/resources")} className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">Назад к ресурсам</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-gray-200">
      <CodeForumHeader user={user} />

      <main className="container mx-auto max-w-4xl px-4 py-6">
        <button onClick={() => navigate("/codeforum/resources")} className="mb-4 inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300">
          <ArrowLeft className="h-4 w-4" />
          К ресурсам Code Forum
        </button>

        <div className="rounded-lg border border-[#1a1a3e] bg-[#0f0f23] p-4 md:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded bg-emerald-600/15 px-2 py-1 text-xs uppercase tracking-wide text-emerald-300">{resource.resource_type}</span>
            <span className="text-xs text-gray-500">{format(new Date(resource.created_at), "d MMMM yyyy", { locale: ru })}</span>
          </div>

          <h1 className="text-xl font-bold text-white md:text-2xl">{resource.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-400">
            {resource.profiles?.username && (
              <StyledUsername
                username={resource.profiles.username}
                usernameCss={resource.profiles.username_css}
                profilePath={`/codeforum/profile/${encodeURIComponent(resource.profiles.username)}`}
              />
            )}
            <span>•</span>
            <span>{resource.downloads || 0} загрузок</span>
          </div>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-gray-300">{resource.description}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#1a1a3e] pt-4">
            <LikeButton contentType="resource" contentId={resource.id} authorId={resource.user_id} />
            <StarRating rating={userRating || resource.rating || 0} onRate={handleRate} readonly={!user || ratingSubmitting} size="md" />
            <button onClick={handleOpenResource} className="inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700">
              {resource.file_url ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
              {resource.file_url ? "Скачать" : "Открыть"}
            </button>
          </div>
        </div>

        <section className="mt-6 rounded-lg border border-[#1a1a3e] bg-[#0f0f23] p-4 md:p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Комментарии</h2>

          {comments.length === 0 ? (
            <p className="text-sm text-gray-500">Комментариев пока нет.</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-lg border border-[#1a1a3e] bg-[#16213e]/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                      {comment.profiles?.username && (
                        <StyledUsername
                          username={comment.profiles.username}
                          usernameCss={comment.profiles.username_css}
                          profilePath={`/codeforum/profile/${encodeURIComponent(comment.profiles.username)}`}
                        />
                      )}
                      <span>•</span>
                      <span>{format(new Date(comment.created_at), "d MMM yyyy HH:mm", { locale: ru })}</span>
                    </div>

                    {user?.id === comment.user_id && (
                      <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-500 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">{comment.content}</p>
                </div>
              ))}
            </div>
          )}

          {user ? (
            <div className="mt-4 space-y-3">
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={4} className="w-full rounded border border-[#1a1a3e] bg-[#16213e] px-3 py-2 text-sm text-gray-100" placeholder="Оставить комментарий..." />
              <button onClick={handleSubmitComment} disabled={submitting} className="inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50">
                <Send className="h-4 w-4" />
                {submitting ? "Отправка..." : "Отправить"}
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">Войдите, чтобы комментировать ресурс.</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default CodeForumResourceView;