import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StyledUsername from "@/components/StyledUsername";

interface UserLinkProps {
  username: string;
  avatarUrl?: string | null;
  showAvatar?: boolean;
  isVerified?: boolean;
  userId?: string;
  className?: string;
  profilePath?: string;
}

const UserLink = ({ 
  username, 
  avatarUrl, 
  showAvatar = true, 
  isVerified = false,
  userId,
  className = "",
  profilePath,
}: UserLinkProps) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(profilePath || `/profile/${encodeURIComponent(username)}`);
  };

  return (
    <div 
      className={`inline-flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      onClick={handleClick}
    >
      {showAvatar && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl || undefined} />
          <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      <StyledUsername 
        username={username} 
        userId={userId}
        isVerified={isVerified}
        profilePath={profilePath}
        onClick={handleClick}
      />
    </div>
  );
};

export default UserLink;
