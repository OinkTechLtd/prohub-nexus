import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import AvatarWithBorder from "@/components/AvatarWithBorder";
import { Button } from "@/components/ui/button";
import { MessageCircle, User } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface MiniProfileCardProps {
  children: React.ReactNode;
  username: string;
  userId?: string;
  profilePath?: string;
}

const MiniProfileCard = ({ children, username, userId, profilePath }: MiniProfileCardProps) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [role, setRole] = useState("newbie");
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState({ topics: 0, posts: 0 });

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      const q = supabase.from("profiles").select("*");
      const { data } = userId
        ? await q.eq("id", userId).maybeSingle()
        : await q.eq("username", username).maybeSingle();

      if (data) {
        setProfile(data);
        // get role
        const { data: roleData } = await supabase.rpc("get_user_role" as any, { _user_id: data.id });
        if (roleData) setRole(roleData as string);
        // get stats
        const [topicRes, postRes] = await Promise.all([
          supabase.from("topics").select("id", { count: "exact", head: true }).eq("user_id", data.id),
          supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", data.id),
        ]);
        setStats({
          topics: topicRes.count || 0,
          posts: postRes.count || 0,
        });
      }
    };

    load();
  }, [open, username, userId]);

  const roleLabels: Record<string, string> = {
    admin: "Администратор",
    moderator: "Модератор",
    editor: "Редактор",
    pro: "Про",
    newbie: "Новичок",
  };

  const roleColors: Record<string, string> = {
    admin: "text-red-500",
    moderator: "text-blue-500",
    editor: "text-purple-500",
    pro: "text-yellow-500",
    newbie: "text-muted-foreground",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span className="inline-flex">{children}</span>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" side="bottom">
        {profile ? (
          <div className="space-y-3">
            {/* Banner */}
            <div className="h-16 rounded-t-md bg-gradient-to-r from-primary/30 to-primary/10 relative overflow-hidden">
              {profile.banner_url && (
                <img src={profile.banner_url} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            {/* Avatar + info */}
            <div className="px-3 -mt-8 relative z-10">
              <AvatarWithBorder
                src={profile.avatar_url}
                fallback={profile.username?.[0]?.toUpperCase() || "?"}
                role={role}
                size="lg"
              />
              <div className="mt-2 flex items-center gap-1">
                <span className="font-semibold text-sm">{profile.username}</span>
                {profile.is_verified && <VerifiedBadge className="h-4 w-4" />}
              </div>
              <span className={`text-xs font-medium ${roleColors[role] || ""}`}>
                {roleLabels[role] || role}
              </span>
              {profile.custom_title && (
                <div className="text-xs mt-0.5" style={{ color: profile.custom_title_color || undefined }}>
                  {profile.custom_title}
                </div>
              )}
            </div>
            {/* Stats */}
            <div className="px-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Тем: <span className="text-foreground font-medium">{stats.topics}</span></div>
              <div>Постов: <span className="text-foreground font-medium">{stats.posts}</span></div>
              <div className="col-span-2">
                На форуме: {profile.created_at
                  ? formatDistanceToNow(new Date(profile.created_at), { locale: ru, addSuffix: false })
                  : "—"}
              </div>
            </div>
            {/* Actions */}
            <div className="px-3 pb-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => {
                  setOpen(false);
                  navigate(profilePath || `/profile/${encodeURIComponent(profile.username)}`);
                }}
              >
                <User className="h-3 w-3 mr-1" />
                Профиль
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => {
                  setOpen(false);
                  navigate("/messages");
                }}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Написать
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">Загрузка...</div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default MiniProfileCard;
