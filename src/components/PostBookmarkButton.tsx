import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PostBookmarkButtonProps {
  postId: string;
  postContent: string;
  topicTitle?: string;
  topicId?: string;
}

const STORAGE_KEY = "prohub_bookmarks";

export interface BookmarkItem {
  postId: string;
  content: string;
  topicTitle?: string;
  topicId?: string;
  savedAt: string;
}

export const getBookmarks = (): BookmarkItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const PostBookmarkButton = ({ postId, postContent, topicTitle, topicId }: PostBookmarkButtonProps) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const bookmarks = getBookmarks();
    setIsBookmarked(bookmarks.some((b) => b.postId === postId));
  }, [postId]);

  const toggleBookmark = () => {
    const bookmarks = getBookmarks();
    if (isBookmarked) {
      const updated = bookmarks.filter((b) => b.postId !== postId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setIsBookmarked(false);
      toast({ title: "Закладка удалена" });
    } else {
      bookmarks.push({
        postId,
        content: postContent.substring(0, 150),
        topicTitle,
        topicId,
        savedAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
      setIsBookmarked(true);
      toast({ title: "Добавлено в закладки" });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs gap-1"
      onClick={toggleBookmark}
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-3 w-3 text-primary" />
      ) : (
        <Bookmark className="h-3 w-3" />
      )}
    </Button>
  );
};

export default PostBookmarkButton;
