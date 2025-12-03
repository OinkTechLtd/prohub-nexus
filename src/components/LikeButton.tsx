import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useReputation } from "@/hooks/useReputation";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  contentType: "topic" | "post" | "resource" | "video";
  contentId: string;
  authorId: string;
  initialLikes?: number;
  size?: "sm" | "default";
}

export const LikeButton = ({ 
  contentType, 
  contentId, 
  authorId, 
  initialLikes = 0,
  size = "default" 
}: LikeButtonProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  const { likeContent, checkIfLiked, getLikesCount } = useReputation();

  useEffect(() => {
    loadLikeState();
  }, [contentId]);

  const loadLikeState = async () => {
    const liked = await checkIfLiked(contentType, contentId);
    setIsLiked(liked);
    
    const count = await getLikesCount(contentType, contentId);
    setLikesCount(count);
  };

  const handleLike = async () => {
    setLoading(true);
    try {
      const result = await likeContent(contentType, contentId, authorId);
      if (result !== null) {
        setIsLiked(result);
        setLikesCount(prev => result ? prev + 1 : Math.max(0, prev - 1));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleLike}
      disabled={loading}
      className={cn(
        "gap-1",
        isLiked && "text-red-500 hover:text-red-600"
      )}
    >
      <Heart className={cn(
        "h-4 w-4",
        isLiked && "fill-current"
      )} />
      {likesCount > 0 && <span>{likesCount}</span>}
    </Button>
  );
};
