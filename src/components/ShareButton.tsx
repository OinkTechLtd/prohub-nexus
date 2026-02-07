import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  title: string;
  url?: string;
  text?: string;
}

const ShareButton = ({ title, url, text }: ShareButtonProps) => {
  const { toast } = useToast();

  const handleShare = async () => {
    const shareUrl = url || window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Ссылка скопирована" });
    }
  };

  return (
    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={handleShare}>
      <Share2 className="h-3 w-3" />
      Поделиться
    </Button>
  );
};

export default ShareButton;
