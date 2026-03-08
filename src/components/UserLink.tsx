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
}

const UserLink = ({ 
  username, 
  avatarUrl, 
  showAvatar = true, 
  isVerified = false,
  userId,
  className = "" 
}: UserLinkProps) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${username}`);
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
        isVerified={isVerified}
        onClick={handleClick}
      />
    </div>
  );
};

export default UserLink;
