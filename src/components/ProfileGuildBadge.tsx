import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface ProfileGuildBadgeProps {
  guild: {
    id: string;
    name: string;
    tag: string;
    logo_url?: string | null;
    color?: string;
    is_official?: boolean;
  };
  role: string;
}

const ProfileGuildBadge = ({ guild, role }: ProfileGuildBadgeProps) => {
  const navigate = useNavigate();

  const getRoleLabel = (r: string) => {
    const labels: Record<string, string> = {
      owner: 'Владелец',
      admin: 'Администратор',
      moderator: 'Модератор',
      member: 'Участник',
    };
    return labels[r] || r;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className="cursor-pointer"
      onClick={() => navigate(`/guild/${guild.id}`)}
    >
      <div 
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
        style={{ borderColor: guild.color || '#6366f1' }}
      >
        <Avatar className="h-6 w-6">
          {guild.logo_url ? (
            <AvatarImage src={guild.logo_url} alt={guild.name} />
          ) : (
            <AvatarFallback 
              className="text-xs font-bold text-white"
              style={{ backgroundColor: guild.color || '#6366f1' }}
            >
              {guild.tag}
            </AvatarFallback>
          )}
        </Avatar>
        
        <div className="flex items-center gap-1.5">
          {guild.is_official && (
            <Crown className="h-3 w-3 text-yellow-500" />
          )}
          <span className="text-sm font-medium">[{guild.tag}]</span>
          <span className="text-sm text-muted-foreground">{guild.name}</span>
        </div>

        <Badge 
          variant="secondary" 
          className="text-xs h-5"
          style={{ 
            backgroundColor: `${guild.color || '#6366f1'}20`,
            color: guild.color || '#6366f1'
          }}
        >
          {getRoleLabel(role)}
        </Badge>
      </div>
    </motion.div>
  );
};

export default ProfileGuildBadge;
