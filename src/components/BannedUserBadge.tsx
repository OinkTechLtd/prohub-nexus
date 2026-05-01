import { useEffect, useState } from "react";
import { XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BannedUserBadgeProps {
  userId?: string | null;
  username?: string | null;
  className?: string;
}

/**
 * Плашка "Пользователь заблокирован" в стиле pawno-help.ru.
 * Показывается над постами и в шапке профиля забаненных пользователей.
 */
const BannedUserBadge = ({ userId, username, className = "" }: BannedUserBadgeProps) => {
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      let uid = userId;
      if (!uid && username) {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .ilike("username", username)
          .maybeSingle();
        uid = data?.id;
      }
      if (!uid) return;
      const { data } = await supabase.rpc("is_user_banned" as any, { _user_id: uid });
      if (!cancelled) setIsBanned(!!data);
    };
    check();
    return () => { cancelled = true; };
  }, [userId, username]);

  if (!isBanned) return null;

  return (
    <div
      className={`flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm ${className}`}
      role="alert"
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive">
        <XCircle className="h-4 w-4 text-destructive-foreground" />
      </span>
      <p className="text-destructive-foreground/90 leading-snug">
        <strong>Обратите внимание</strong>, пользователь заблокирован на форуме.
        Не рекомендуется проводить сделки. Мы не несём ответственности за действия пользователя вне форума.
      </p>
    </div>
  );
};

export default BannedUserBadge;
