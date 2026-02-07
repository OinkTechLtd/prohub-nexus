import { useMemo } from "react";

interface BBCodeRendererProps {
  content: string;
}

const BBCodeRenderer = ({ content }: BBCodeRendererProps) => {
  const rendered = useMemo(() => {
    const parts: React.ReactNode[] = [];
    let remaining = content;
    let key = 0;

    // Process [QUOTE="username"]...[/QUOTE] blocks
    const quoteRegex = /\[QUOTE="([^"]+)"\]([\s\S]*?)\[\/QUOTE\]/g;
    let lastIndex = 0;
    let match;

    while ((match = quoteRegex.exec(content)) !== null) {
      // Add text before the quote
      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index);
        if (textBefore.trim()) {
          parts.push(
            <span key={key++} className="whitespace-pre-wrap break-words">
              {textBefore}
            </span>
          );
        }
      }

      const username = match[1];
      const quoteContent = match[2].trim();

      parts.push(
        <div
          key={key++}
          className="border-l-4 border-primary/50 bg-muted/50 rounded-r-md p-3 my-2"
        >
          <p className="text-xs font-semibold text-primary mb-1">
            {username} написал(а):
          </p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
            {quoteContent}
          </p>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last quote
    if (lastIndex < content.length) {
      const textAfter = content.slice(lastIndex);
      if (textAfter.trim()) {
        parts.push(
          <span key={key++} className="whitespace-pre-wrap break-words">
            {textAfter}
          </span>
        );
      }
    }

    // If no quotes found, just render plain text
    if (parts.length === 0) {
      return <span className="whitespace-pre-wrap break-words">{content}</span>;
    }

    return <>{parts}</>;
  }, [content]);

  return <div>{rendered}</div>;
};

export default BBCodeRenderer;
