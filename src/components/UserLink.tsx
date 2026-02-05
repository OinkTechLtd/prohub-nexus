import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VerifiedBadge from "@/components/VerifiedBadge";

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
  const [verified, setVerified] = useState(isVerified);

  useEffect(() => {
    // If isVerified is explicitly passed, use it
    if (isVerified) {
      setVerified(true);
      return;
    }

    // Otherwise, fetch from database by username
    const fetchVerificationStatus = async () => {
      if (!username) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("is_verified")
        .eq("username", username)
        .maybeSingle();

      if (data) {
        setVerified(data.is_verified || false);
      }
    };

    fetchVerificationStatus();
  }, [username, isVerified]);

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
      <span className="font-medium text-foreground hover:underline">
        {username}
      </span>
      {verified && <VerifiedBadge className="h-4 w-4" />}
    </div>
  );
};

export default UserLink;
