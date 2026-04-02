import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CF_ROLES = [
  { key: "moderator", label: "Модератор", color: "bg-red-600", order: 5 },
  { key: "editor", label: "Редактор", color: "bg-purple-600", order: 4 },
  { key: "advanced", label: "Продвинутый", color: "bg-blue-600", order: 3 },
  { key: "pro", label: "Профи", color: "bg-green-600", order: 2 },
  { key: "newbie", label: "Новичок", color: "bg-gray-600", order: 1 },
];

export function useCodeForumRole(userId: string | undefined) {
  const [role, setRole] = useState<string>("newbie");
  const [roleLabel, setRoleLabel] = useState("Новичок");
  const [roleColor, setRoleColor] = useState("bg-gray-600");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetchRole = async () => {
      // Check codeforum_roles first
      const { data: cfRole } = await supabase
        .from("codeforum_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (cfRole?.role) {
        applyRole(cfRole.role);
        setLoading(false);
        return;
      }

      // Map from ProHub role
      const { data: prohubRole } = await supabase
        .rpc("get_user_role", { _user_id: userId });

      let mapped = "newbie";
      switch (prohubRole) {
        case "admin": mapped = "moderator"; break;
        case "moderator": mapped = "editor"; break;
        case "editor": mapped = "advanced"; break;
        case "pro": mapped = "pro"; break;
        default: mapped = "newbie";
      }
      applyRole(mapped);
      setLoading(false);
    };

    const applyRole = (r: string) => {
      const found = CF_ROLES.find((cr) => cr.key === r) || CF_ROLES[4];
      setRole(found.key);
      setRoleLabel(found.label);
      setRoleColor(found.color);
    };

    fetchRole();
  }, [userId]);

  return { role, roleLabel, roleColor, loading, canModerate: role === "moderator" || role === "editor" };
}

export { CF_ROLES };
