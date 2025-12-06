import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VerifiedBadge from "@/components/VerifiedBadge";

interface UserLinkProps {
  username: string;
  avatarUrl?: string | null;
  showAvatar?: boolean;
  isVerified?: boolean;
  className?: string;
}

const UserLink = ({ 
  username, 
  avatarUrl, 
  showAvatar = true, 
  isVerified = false,
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
      <span className="font-medium text-foreground hover:underline">
        {username}
      </span>
      {isVerified && <VerifiedBadge className="h-4 w-4" />}
    </div>
  );
};

export default UserLink;
