import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Trash2, ExternalLink } from "lucide-react";
import { getBookmarks, BookmarkItem } from "@/components/PostBookmarkButton";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const Bookmarks = () => {
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    setBookmarks(getBookmarks().reverse());
  }, []);

  const removeBookmark = (postId: string) => {
    const updated = bookmarks.filter((b) => b.postId !== postId);
    localStorage.setItem("prohub_bookmarks", JSON.stringify(updated));
    setBookmarks(updated);
    toast({ title: "Закладка удалена" });
  };

  const clearAll = () => {
    localStorage.removeItem("prohub_bookmarks");
    setBookmarks([]);
    toast({ title: "Все закладки удалены" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bookmark className="h-7 w-7 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold">Закладки</h1>
          </div>
          {bookmarks.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Trash2 className="h-4 w-4 mr-1" />
              Очистить
            </Button>
          )}
        </div>

        {bookmarks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">У вас нет сохранённых закладок</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((bm) => (
              <Card key={bm.postId} className="hover:bg-accent/30 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {bm.topicTitle && (
                        <p className="text-xs text-primary font-medium mb-1 truncate">
                          {bm.topicTitle}
                        </p>
                      )}
                      <p className="text-sm break-words">{bm.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(bm.savedAt), { addSuffix: true, locale: ru })}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {bm.topicId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/topic/${bm.topicId}`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeBookmark(bm.postId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Bookmarks;
