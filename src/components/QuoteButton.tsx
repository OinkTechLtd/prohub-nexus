import { Button } from "@/components/ui/button";
import { Quote } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuoteButtonProps {
  username: string;
  content: string;
  onQuote: (quotedText: string) => void;
}

const QuoteButton = ({ username, content, onQuote }: QuoteButtonProps) => {
  const handleQuote = () => {
    const quotedText = `[QUOTE="${username}"]${content}[/QUOTE]\n`;
    onQuote(quotedText);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={handleQuote}
        >
          <Quote className="h-3 w-3" />
          Цитата
        </Button>
      </TooltipTrigger>
      <TooltipContent>Цитировать сообщение</TooltipContent>
    </Tooltip>
  );
};

export default QuoteButton;
