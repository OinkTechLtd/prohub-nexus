import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const FLEXDEV_ROLES = [
  { key: "admin",        label: "Администратор",     color: "bg-gradient-to-r from-fuchsia-500 to-pink-500", order: 6 },
  { key: "senior_admin", label: "Ст. администратор", color: "bg-gradient-to-r from-purple-600 to-fuchsia-500", order: 5 },
  { key: "curator",      label: "Куратор",           color: "bg-gradient-to-r from-cyan-500 to-blue-500", order: 4 },
  { key: "moderator",    label: "Модератор",         color: "bg-cyan-600", order: 3 },
  { key: "vip",          label: "VIP",               color: "bg-gradient-to-r from-amber-400 to-yellow-500", order: 2 },
  { key: "newbie",       label: "Новенький",         color: "bg-slate-600", order: 1 },
] as const;

export type FlexDevRoleKey = typeof FLEXDEV_ROLES[number]["key"];

export function useFlexDevRole(userId: string | undefined) {
  const [role, setRole] = useState<FlexDevRoleKey>("newbie");
  const [roleLabel, setRoleLabel] = useState("Новенький");
  const [roleColor, setRoleColor] = useState("bg-slate-600");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;

    const apply = (r: string) => {
      const found = FLEXDEV_ROLES.find((cr) => cr.key === r) ?? FLEXDEV_ROLES[FLEXDEV_ROLES.length - 1];
      if (cancelled) return;
      setRole(found.key);
      setRoleLabel(found.label);
      setRoleColor(found.color);
    };

    (async () => {
      const { data: fdRole } = await (supabase as any)
        .from("flexdev_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      if (fdRole?.role) { apply(fdRole.role); setLoading(false); return; }

      const { data: prohubRole } = await supabase.rpc("get_user_role", { _user_id: userId });
      let mapped: FlexDevRoleKey = "newbie";
      switch (prohubRole) {
        case "admin":     mapped = "admin"; break;
        case "moderator": mapped = "senior_admin"; break;
        case "editor":    mapped = "curator"; break;
        case "pro":       mapped = "vip"; break;
        default:          mapped = "newbie";
      }
      apply(mapped);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  return { role, roleLabel, roleColor, loading, canModerate: role === "admin" || role === "senior_admin" || role === "curator" || role === "moderator" };
}
