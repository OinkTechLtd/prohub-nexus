import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CodeForumHeader from "@/components/CodeForumHeader";
import StyledUsername from "@/components/StyledUsername";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      const { data: categories } = await supabase.from("categories").select("id").eq("forum_id", "codeforum");
      const categoryIds = (categories || []).map((item) => item.id);

      if (categoryIds.length === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const { data: cfTopics } = await supabase
        .from("topics")
        .select("id, user_id")
        .in("category_id", categoryIds);

      const topicIds = (cfTopics || []).map((item) => item.id);

      const { data: cfPosts } = topicIds.length > 0
        ? await supabase.from("posts").select("user_id").in("topic_id", topicIds)
        : { data: [] as { user_id: string | null }[] };

      // Get all codeforum roles
      const { data: cfRoles } = await supabase.from("codeforum_roles").select("user_id, role");
      const cfRolesMap = new Map((cfRoles || []).map((r) => [r.user_id, r.role]));

      const memberIds = new Set<string>();
      for (const topic of cfTopics || []) if (topic.user_id) memberIds.add(topic.user_id);
      for (const post of (cfPosts as { user_id: string | null }[]) || []) if (post.user_id) memberIds.add(post.user_id);
      for (const role of cfRoles || []) if (role.user_id) memberIds.add(role.user_id);

      if (memberIds.size === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, username_css, created_at")
        .in("id", Array.from(memberIds))
        .order("created_at", { ascending: true });

      if (!profiles) { setLoading(false); return; }

      // Get all prohub roles
      const { data: phRoles } = await supabase.from("user_roles").select("user_id, role");
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
      enriched.sort((a, b) => (roleOrder[b.cfRole] || 0) - (roleOrder[a.cfRole] || 0));

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
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-[#16213e] text-xs">{member.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
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
