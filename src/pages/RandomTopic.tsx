import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Shuffle } from "lucide-react";

/**
 * Случайная тема — кидает на рандомный неcкрытый топик ProHub.
 * Маленькая «джем»-фича для исследования форума.
 */
const RandomTopic = () => {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Ищем интересную тему...");

  useEffect(() => {
    (async () => {
      const { count } = await supabase
        .from("topics")
        .select("id", { count: "exact", head: true })
        .eq("is_hidden", false);
      if (!count) { setMsg("Пока нет тем."); return; }
      const offset = Math.floor(Math.random() * count);
      const { data } = await supabase
        .from("topics")
        .select("id")
        .eq("is_hidden", false)
        .range(offset, offset);
      if (data?.[0]?.id) navigate(`/topic/${data[0].id}`, { replace: true });
      else setMsg("Не удалось найти тему.");
    })();
  }, [navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center space-y-2">
          <Shuffle className="h-10 w-10 mx-auto text-primary animate-pulse" />
          <p>{msg}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RandomTopic;
