import { useNavigate } from "react-router-dom";
import { useEffect, useId, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import VerifiedBadge from "@/components/VerifiedBadge";
import { sanitizeUsernameCss } from "@/lib/usernameCss";

interface StyledUsernameProps {
  username: string;
  usernameCss?: string | null;
  isVerified?: boolean;
  userId?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  profilePath?: string;
}

const StyledUsername = ({ 
  username, 
  usernameCss, 
  isVerified = false,
  userId,
  className = "",
  onClick,
  profilePath,
}: StyledUsernameProps) => {
  const navigate = useNavigate();
  const uniqueId = useId();
  const [cssData, setCssData] = useState<string | null>(usernameCss ?? null);
  const [verified, setVerified] = useState(isVerified);

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
      const query = supabase.from("profiles").select("is_verified, username_css");
      const { data } = userId
        ? await query.eq("id", userId).maybeSingle()
        : await query.eq("username", username).maybeSingle();

      if (data) {
        setVerified(data.is_verified || false);
        if (usernameCss === undefined) {
          setCssData(data.username_css || null);
        }
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
    } else {
      navigate(profilePath || `/profile/${encodeURIComponent(username)}`);
    }
  };

  return (
    <span 
      className={`inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      onClick={handleClick}
    >
      {parsed.keyframes && (
        <style dangerouslySetInnerHTML={{ __html: parsed.keyframes }} />
      )}
      <span className="font-medium overflow-hidden max-h-6 leading-normal" style={parsed.style}>
        {username}
      </span>
      {verified && <VerifiedBadge className="h-4 w-4" />}
    </span>
  );
};

export default StyledUsername;
