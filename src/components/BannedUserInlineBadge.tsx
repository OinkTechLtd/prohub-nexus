import { useEffect, useState } from "react";
import { XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  userId?: string | null;
  username?: string | null;
  className?: string;
}

/**
 * Маленький inline-индикатор бана рядом с ником/аватаром.
 * Используется в превью авторов, списках сообщений и т.п.
 */
const BannedUserInlineBadge = ({ userId, username, className = "" }: Props) => {
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let uid = userId;
      if (!uid && username) {
        const { data } = await supabase.from("profiles").select("id").ilike("username", username).maybeSingle();
        uid = data?.id;
      }
      if (!uid) return;
      const { data } = await supabase.rpc("is_user_banned" as any, { _user_id: uid });
      if (!cancelled) setIsBanned(!!data);
    })();
    return () => { cancelled = true; };
  }, [userId, username]);

  if (!isBanned) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white align-middle shadow-sm ring-1 ring-white/30 ${className}`}
            aria-label="Заблокирован"
          >
            <XCircle className="h-3 w-3" />
            <span className="leading-none">БАН</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>Пользователь заблокирован</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BannedUserInlineBadge;
