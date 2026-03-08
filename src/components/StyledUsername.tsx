import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import VerifiedBadge from "@/components/VerifiedBadge";

interface StyledUsernameProps {
  username: string;
  usernameCss?: string | null;
  isVerified?: boolean;
  userId?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Sanitizes user CSS to prevent XSS and layout-breaking styles.
 * Only allows safe text-decoration properties.
 */
const sanitizeCss = (css: string): React.CSSProperties => {
  const style: React.CSSProperties = {};
  
  // Parse CSS string into individual properties
  const declarations = css.split(';').map(d => d.trim()).filter(Boolean);
  
  // Whitelist of allowed CSS properties
  const allowedProps: Record<string, string> = {
    'color': 'color',
    'background': 'background',
    'background-color': 'backgroundColor',
    'background-image': 'backgroundImage',
    '-webkit-background-clip': 'WebkitBackgroundClip',
    'background-clip': 'backgroundClip',
    '-webkit-text-fill-color': 'WebkitTextFillColor',
    'text-shadow': 'textShadow',
    'text-decoration': 'textDecoration',
    'text-decoration-color': 'textDecorationColor',
    'text-decoration-style': 'textDecorationStyle',
    'font-weight': 'fontWeight',
    'font-style': 'fontStyle',
    'font-variant': 'fontVariant',
    'letter-spacing': 'letterSpacing',
    'text-transform': 'textTransform',
    'animation': 'animation',
    'filter': 'filter',
    'opacity': 'opacity',
    'border-bottom': 'borderBottom',
  };

  for (const decl of declarations) {
    const colonIndex = decl.indexOf(':');
    if (colonIndex === -1) continue;
    
    const prop = decl.substring(0, colonIndex).trim().toLowerCase();
    const value = decl.substring(colonIndex + 1).trim();
    
    // Block dangerous values
    if (value.includes('url(') && !value.includes('linear-gradient') && !value.includes('radial-gradient')) continue;
    if (value.includes('expression(')) continue;
    if (value.includes('javascript:')) continue;
    
    const reactProp = allowedProps[prop];
    if (reactProp) {
      (style as any)[reactProp] = value;
    }
  }
  
  return style;
};

const StyledUsername = ({ 
  username, 
  usernameCss, 
  isVerified = false,
  userId,
  className = "",
  onClick
}: StyledUsernameProps) => {
  const navigate = useNavigate();
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

    if (!username) return;

    const fetchData = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_verified, username_css")
        .eq("username", username)
        .maybeSingle();

      if (data) {
        setVerified(data.is_verified || false);
        if (usernameCss === undefined) {
          setCssData((data as any).username_css || null);
        }
      }
    };

    fetchData();
  }, [username, isVerified, usernameCss]);

  const parsedStyle = useMemo(() => {
    if (!cssData) return {};
    return sanitizeCss(cssData);
  }, [cssData]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    } else {
      navigate(`/profile/${username}`);
    }
  };

  return (
    <span 
      className={`inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      onClick={handleClick}
    >
      <span 
        className="font-medium"
        style={parsedStyle}
      >
        {username}
      </span>
      {verified && <VerifiedBadge className="h-4 w-4" />}
    </span>
  );
};

export default StyledUsername;
