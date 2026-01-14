import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Crown, Shield, Star } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GuildMember {
  user_id: string;
  role: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

interface GuildCardProps {
  id: string;
  name: string;
  tag: string;
  description?: string | null;
  logo_url?: string | null;
  color?: string;
  member_count: number;
  is_official?: boolean;
  members?: GuildMember[];
  className?: string;
  onClick?: () => void;
}

const GuildCard = ({
  name,
  tag,
  description,
  logo_url,
  color = "#6366f1",
  member_count,
  is_official,
  members = [],
  className,
  onClick,
}: GuildCardProps) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-3 w-3 text-red-500" />;
      case 'moderator':
        return <Star className="h-3 w-3 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          "cursor-pointer hover:shadow-lg transition-all overflow-hidden",
          className
        )}
        onClick={onClick}
      >
        {/* Guild Banner */}
        <div 
          className="h-16 relative"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}80)` }}
        >
          {is_official && (
            <Badge className="absolute top-2 right-2 bg-yellow-500 text-black text-xs">
              <Crown className="h-3 w-3 mr-1" />
              Официальная
            </Badge>
          )}
        </div>

        <CardContent className="pt-0 -mt-8">
          {/* Guild Logo */}
          <div className="flex items-end gap-3 mb-3">
            <Avatar className="h-16 w-16 border-4 border-background">
              {logo_url ? (
                <AvatarImage src={logo_url} alt={name} />
              ) : (
                <AvatarFallback 
                  className="text-xl font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {tag}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="pb-1">
              <h3 className="font-bold text-lg">{name}</h3>
              <Badge variant="outline" className="text-xs">
                [{tag}]
              </Badge>
            </div>
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {description}
            </p>
          )}

          {/* Members */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{member_count} участников</span>
            </div>

            {/* Member Avatars */}
            <div className="flex -space-x-2">
              {members.slice(0, 5).map((member, index) => (
                <motion.div
                  key={member.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <Avatar className="h-7 w-7 border-2 border-background">
                    <AvatarImage src={member.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {member.profiles?.username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  {getRoleIcon(member.role) && (
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                      {getRoleIcon(member.role)}
                    </div>
                  )}
                </motion.div>
              ))}
              {member_count > 5 && (
                <Avatar className="h-7 w-7 border-2 border-background">
                  <AvatarFallback className="text-xs bg-muted">
                    +{member_count - 5}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GuildCard;
