import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo, useId } from "react";
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
 * Extracts @keyframes blocks from CSS and returns them separately.
 */
const extractKeyframes = (css: string): { keyframes: string; remaining: string } => {
  const keyframeBlocks: string[] = [];
  const remaining = css.replace(/@keyframes\s+[\w-]+\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/gi, (match) => {
    keyframeBlocks.push(match);
    return '';
  });
  return { keyframes: keyframeBlocks.join('\n'), remaining };
};

/**
 * Sanitizes user CSS to prevent XSS and layout-breaking styles.
 * Supports XenForo-like decorations: colors, gradients, animations, text effects.
 */
const sanitizeCss = (css: string): { style: React.CSSProperties; keyframes: string } => {
  const style: React.CSSProperties = {};
  
  // Extract keyframes first
  const { keyframes, remaining } = extractKeyframes(css);
  
  const declarations = remaining.split(';').map(d => d.trim()).filter(Boolean);
  
  const allowedProps: Record<string, string> = {
    'color': 'color',
    'background': 'background',
    'background-color': 'backgroundColor',
    'background-image': 'backgroundImage',
    'background-size': 'backgroundSize',
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
    'animation-name': 'animationName',
    'animation-duration': 'animationDuration',
    'animation-timing-function': 'animationTimingFunction',
    'animation-iteration-count': 'animationIterationCount',
    'animation-direction': 'animationDirection',
    'animation-delay': 'animationDelay',
    'filter': 'filter',
    'opacity': 'opacity',
    'border-bottom': 'borderBottom',
    'text-stroke': 'WebkitTextStroke',
    '-webkit-text-stroke': 'WebkitTextStroke',
    '-webkit-text-stroke-color': 'WebkitTextStrokeColor',
    '-webkit-text-stroke-width': 'WebkitTextStrokeWidth',
    'transform': 'transform',
    'transition': 'transition',
  };

  for (const decl of declarations) {
    const colonIndex = decl.indexOf(':');
    if (colonIndex === -1) continue;
    
    const prop = decl.substring(0, colonIndex).trim().toLowerCase();
    const value = decl.substring(colonIndex + 1).trim();
    
    // Block dangerous values
    if (value.includes('url(') && !value.includes('linear-gradient') && !value.includes('radial-gradient') && !value.includes('conic-gradient')) continue;
    if (value.includes('expression(')) continue;
    if (value.includes('javascript:')) continue;
    if (value.includes('import')) continue;
    
    const reactProp = allowedProps[prop];
    if (reactProp) {
      (style as any)[reactProp] = value;
    }
  }
  
  return { style, keyframes };
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

  const parsed = useMemo(() => {
    if (!cssData) return { style: {}, keyframes: '' };
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

  // Generate a safe class name for scoped keyframes
  const scopeClass = `styled-un-${uniqueId.replace(/:/g, '')}`;

  return (
    <span 
      className={`inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      onClick={handleClick}
    >
      {parsed.keyframes && (
        <style dangerouslySetInnerHTML={{ __html: parsed.keyframes }} />
      )}
      <span 
        className={`font-medium ${scopeClass}`}
        style={parsed.style}
      >
        {username}
      </span>
      {verified && <VerifiedBadge className="h-4 w-4" />}
    </span>
  );
};

export default StyledUsername;
