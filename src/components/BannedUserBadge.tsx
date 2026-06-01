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
      className={`flex items-start gap-2 rounded-md border-2 border-red-600 bg-red-600 p-3 text-sm text-white shadow-md ${className}`}
      role="alert"
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white">
        <XCircle className="h-4 w-4 text-red-600" />
      </span>
      <p className="leading-snug text-white">
        <strong className="font-bold">⚠️ Пользователь заблокирован.</strong>{" "}
        Не рекомендуется проводить с ним сделки. Администрация форума не несёт ответственности за его действия вне форума.
      </p>
    </div>
  );
};

export default BannedUserBadge;
