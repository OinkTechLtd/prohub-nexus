import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CodeBlockProps {
  code: string;
}

const CodeBlock = ({ code }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({ title: "Код скопирован" });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: "Не удалось скопировать код", variant: "destructive" });
    }
  };

  return (
    <div className="my-2 overflow-hidden rounded-md border border-border/60 bg-card">
      <div className="flex items-center justify-end border-b border-border/60 bg-muted/60 px-2 py-1.5">
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Скопировано" : "Копировать"}
        </Button>
      </div>
      <pre className="overflow-x-auto p-3 text-sm font-mono whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;