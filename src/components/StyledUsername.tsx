import { useNavigate } from "react-router-dom";
import { useEffect, useId, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import VerifiedBadge from "@/components/VerifiedBadge";
import MiniProfileCard from "@/components/MiniProfileCard";
import UsernameFlair from "@/components/UsernameFlair";
import { sanitizeUsernameCss } from "@/lib/usernameCss";

interface StyledUsernameProps {
  username: string;
  usernameCss?: string | null;
  isVerified?: boolean;
  userId?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  profilePath?: string;
  disableMiniProfile?: boolean;
}

const StyledUsername = ({ 
  username, 
  usernameCss, 
  isVerified = false,
  userId,
  className = "",
  onClick,
  profilePath,
  disableMiniProfile = false,
}: StyledUsernameProps) => {
  const navigate = useNavigate();
  const uniqueId = useId();
  const [cssData, setCssData] = useState<string | null>(usernameCss ?? null);
  const [verified, setVerified] = useState(isVerified);
  const [flair, setFlair] = useState<{ prefix?: string | null; suffix?: string | null; icon?: string | null; sticker?: string | null }>({});

  useEffect(() => {
    if (usernameCss !== undefined) {
      setCssData(usernameCss ?? null);
    }
  }, [usernameCss]);

  useEffect(() => {
    if (isVerified) {
      setVerified(true);
      return;
    }

    if (!username && !userId) return;

    const fetchData = async () => {
      const query = supabase
        .from("profiles")
        .select("is_verified, username_css, flair_emoji_prefix, flair_emoji_suffix, flair_icon, flair_sticker");
      const { data } = userId
        ? await query.eq("id", userId).maybeSingle()
        : await query.eq("username", username).maybeSingle();

      if (data) {
        setVerified((data as any).is_verified || false);
        if (usernameCss === undefined) {
          setCssData((data as any).username_css || null);
        }
        setFlair({
          prefix: (data as any).flair_emoji_prefix,
          suffix: (data as any).flair_emoji_suffix,
          icon: (data as any).flair_icon,
          sticker: (data as any).flair_sticker,
        });
      }
    };

    fetchData();
  }, [username, isVerified, usernameCss, userId]);

  const scopePrefix = useMemo(() => `username-${uniqueId.replace(/:/g, "")}`, [uniqueId]);

  const parsed = useMemo(() => {
    if (!cssData) return { style: {}, keyframes: '' };
    return sanitizeUsernameCss(cssData, scopePrefix);
  }, [cssData, scopePrefix]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
    // If mini profile is enabled, the popover handles it — no navigation
    if (disableMiniProfile && !onClick) {
      navigate(profilePath || `/profile/${encodeURIComponent(username)}`);
    }
  };

  const inner = (
    <span 
      className={`inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      onClick={handleClick}
    >
      {parsed.keyframes && (
        <style dangerouslySetInnerHTML={{ __html: parsed.keyframes }} />
      )}
      <UsernameFlair prefix={flair.prefix} icon={flair.icon} />
      <span className="font-medium overflow-hidden max-h-6 leading-normal" style={parsed.style}>
        {username}
      </span>
      <UsernameFlair suffix={flair.suffix} sticker={flair.sticker} />
      {verified && <VerifiedBadge className="h-4 w-4" />}
    </span>
  );

  if (disableMiniProfile || onClick) {
    return inner;
  }

  return (
    <MiniProfileCard username={username} userId={userId} profilePath={profilePath}>
      {inner}
    </MiniProfileCard>
  );
};

export default StyledUsername;
