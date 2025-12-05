import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Package, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SearchResult {
  id: string;
  title: string;
  type: "topic" | "resource" | "video";
  created_at: string;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearchActivity?: (query: string) => void;
}

const GlobalSearch = ({ open, onOpenChange, onSearchActivity }: GlobalSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      
      // Track search activity
      onSearchActivity?.(query);
      
      try {
        const [topicsRes, resourcesRes, videosRes] = await Promise.all([
          supabase
            .from("topics")
            .select("id, title, created_at")
            .eq("is_hidden", false)
            .ilike("title", `%${query}%`)
            .limit(5),
          supabase
            .from("resources")
            .select("id, title, created_at")
            .eq("is_hidden", false)
            .ilike("title", `%${query}%`)
            .limit(5),
          supabase
            .from("videos")
            .select("id, title, created_at")
            .eq("is_hidden", false)
            .ilike("title", `%${query}%`)
            .limit(5),
        ]);

        const allResults: SearchResult[] = [
          ...(topicsRes.data || []).map((t) => ({ ...t, type: "topic" as const })),
          ...(resourcesRes.data || []).map((r) => ({ ...r, type: "resource" as const })),
          ...(videosRes.data || []).map((v) => ({ ...v, type: "video" as const })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setResults(allResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, onSearchActivity]);

  const handleResultClick = (result: SearchResult) => {
    onOpenChange(false);
    setQuery("");
    
    switch (result.type) {
      case "topic":
        navigate(`/topic/${result.id}`);
        break;
      case "resource":
        navigate(`/resources`);
        break;
      case "video":
        navigate(`/video/${result.id}`);
        break;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "topic":
        return <FileText className="h-4 w-4" />;
      case "resource":
        return <Package className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "topic":
        return <Badge variant="secondary">Тема</Badge>;
      case "resource":
        return <Badge variant="outline">Ресурс</Badge>;
      case "video":
        return <Badge>Видео</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Глобальный поиск
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по темам, ресурсам и видео..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10"
            autoFocus
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {loading && (
            <div className="text-center py-4 text-muted-foreground">
              Поиск...
            </div>
          )}
          
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              Ничего не найдено
            </div>
          )}
          
          {!loading && results.map((result) => (
            <Card
              key={`${result.type}-${result.id}`}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => handleResultClick(result)}
            >
              <CardContent className="py-3 flex items-center gap-3">
                {getTypeIcon(result.type)}
                <span className="flex-1 truncate">{result.title}</span>
                {getTypeBadge(result.type)}
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
