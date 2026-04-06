import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CodeForumHeader from "@/components/CodeForumHeader";
import StyledUsername from "@/components/StyledUsername";
import AvatarWithBorder from "@/components/AvatarWithBorder";
import { CF_ROLES } from "@/hooks/useCodeForumRole";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface Member {
  id: string;
  username: string;
  avatar_url: string | null;
  username_css: string | null;
  created_at: string;
  cfRole: string;
  cfRoleLabel: string;
  cfRoleColor: string;
}

const CodeForumMembers = () => {
  const [user, setUser] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadMembers();
  }, []);

  const mapProHubRole = (role: string): { key: string; label: string; color: string } => {
    switch (role) {
      case "admin": return { key: "moderator", label: "Модератор", color: "bg-red-600" };
      case "moderator": return { key: "editor", label: "Редактор", color: "bg-purple-600" };
      case "editor": return { key: "advanced", label: "Продвинутый", color: "bg-blue-600" };
      case "pro": return { key: "pro", label: "Профи", color: "bg-green-600" };
      default: return { key: "newbie", label: "Новичок", color: "bg-gray-600" };
    }
  };

  const loadMembers = async () => {
    try {
      const [{ data: profiles }, { data: cfRoles }, { data: phRoles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, avatar_url, username_css, created_at")
          .order("created_at", { ascending: true }),
        supabase.from("codeforum_roles").select("user_id, role"),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      const cfRolesMap = new Map((cfRoles || []).map((r) => [r.user_id, r.role]));

      if (!profiles) { setLoading(false); return; }

      const phRolesMap = new Map<string, string>();
      for (const r of phRoles || []) {
        const existing = phRolesMap.get(r.user_id);
        const order = ["newbie", "pro", "editor", "moderator", "admin"];
        if (!existing || order.indexOf(r.role) > order.indexOf(existing)) {
          phRolesMap.set(r.user_id, r.role);
        }
      }

      const enriched: Member[] = profiles.map((p) => {
        const cfRole = cfRolesMap.get(p.id);
        if (cfRole) {
          const found = CF_ROLES.find((r) => r.key === cfRole) || CF_ROLES[4];
          return { ...p, cfRole: found.key, cfRoleLabel: found.label, cfRoleColor: found.color };
        }
        const phRole = phRolesMap.get(p.id) || "newbie";
        const mapped = mapProHubRole(phRole);
        return { ...p, cfRole: mapped.key, cfRoleLabel: mapped.label, cfRoleColor: mapped.color };
      });

      // Sort by role order desc
      const roleOrder: Record<string, number> = { moderator: 5, editor: 4, advanced: 3, pro: 2, newbie: 1 };
      enriched.sort((a, b) => ((roleOrder[b.cfRole] || 0) - (roleOrder[a.cfRole] || 0)) || a.username.localeCompare(b.username, "ru"));

      setMembers(enriched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-gray-200">
      <CodeForumHeader user={user} />

      <main className="container mx-auto px-4 py-6">
        <h1 className="text-xl md:text-2xl font-bold text-white mb-6">Участники Code Forum</h1>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Загрузка...</div>
        ) : (
          <div className="bg-[#0f0f23] border border-[#1a1a3e] rounded-lg overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-[#16213e]/50 text-xs text-gray-400 uppercase tracking-wider border-b border-[#1a1a3e]">
              <div className="col-span-5">Пользователь</div>
              <div className="col-span-3">Роль</div>
              <div className="col-span-4 text-right">Регистрация</div>
            </div>

            {members.map((member, idx) => (
              <div
                key={member.id}
                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-[#16213e]/30 cursor-pointer transition-colors ${
                  idx < members.length - 1 ? "border-b border-[#1a1a3e]/50" : ""
                }`}
                onClick={() => navigate(`/codeforum/profile/${encodeURIComponent(member.username)}`)}
              >
                <div className="col-span-5 flex items-center gap-3">
                  <AvatarWithBorder
                    src={member.avatar_url}
                    fallback={member.username[0]?.toUpperCase() || "?"}
                    role="newbie"
                    size="sm"
                  />
                  <StyledUsername
                    username={member.username}
                    usernameCss={member.username_css}
                    profilePath={`/codeforum/profile/${encodeURIComponent(member.username)}`}
                    className="text-sm"
                  />
                </div>
                <div className="col-span-3">
                  <span className={`px-2 py-0.5 rounded text-xs text-white ${member.cfRoleColor}`}>
                    {member.cfRoleLabel}
                  </span>
                </div>
                <div className="col-span-4 text-right text-xs text-gray-500">
                  {formatDistanceToNow(new Date(member.created_at), { addSuffix: true, locale: ru })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CodeForumMembers;
