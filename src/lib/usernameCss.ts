import type { CSSProperties } from "react";

const ALLOWED_PROPS: Record<string, keyof CSSProperties | "WebkitBackgroundClip" | "WebkitTextFillColor" | "WebkitTextStroke" | "WebkitTextStrokeColor" | "WebkitTextStrokeWidth"> = {
  color: "color",
  "font-size": "fontSize",
  "font-family": "fontFamily",
  background: "background",
  "background-color": "backgroundColor",
  "background-image": "backgroundImage",
  "background-size": "backgroundSize",
  "background-position": "backgroundPosition",
  "background-repeat": "backgroundRepeat",
  "line-height": "lineHeight",
  "-webkit-background-clip": "WebkitBackgroundClip",
  "background-clip": "backgroundClip",
  "-webkit-text-fill-color": "WebkitTextFillColor",
  "text-shadow": "textShadow",
  "text-decoration": "textDecoration",
  "text-decoration-color": "textDecorationColor",
  "text-decoration-style": "textDecorationStyle",
  "font-weight": "fontWeight",
  "font-style": "fontStyle",
  "font-variant": "fontVariant",
  "letter-spacing": "letterSpacing",
  "text-transform": "textTransform",
  animation: "animation",
  "animation-name": "animationName",
  "animation-duration": "animationDuration",
  "animation-timing-function": "animationTimingFunction",
  "animation-iteration-count": "animationIterationCount",
  "animation-direction": "animationDirection",
  "animation-delay": "animationDelay",
  filter: "filter",
  opacity: "opacity",
  "border-bottom": "borderBottom",
  "text-stroke": "WebkitTextStroke",
  "-webkit-text-stroke": "WebkitTextStroke",
  "-webkit-text-stroke-color": "WebkitTextStrokeColor",
  "-webkit-text-stroke-width": "WebkitTextStrokeWidth",
  transform: "transform",
  transition: "transition",
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const splitDeclarations = (css: string) => {
  const declarations: string[] = [];
  let current = "";
  let parenDepth = 0;
  let quote: "'" | '"' | null = null;

  for (const char of css) {
    if ((char === '"' || char === "'") && (!quote || quote === char)) {
      quote = quote === char ? null : char;
    }

    if (!quote) {
      if (char === "(") parenDepth += 1;
      if (char === ")") parenDepth = Math.max(0, parenDepth - 1);
    }

    if (char === ";" && parenDepth === 0 && !quote) {
      if (current.trim()) declarations.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) declarations.push(current.trim());
  return declarations;
};

const extractKeyframes = (css: string) => {
  const keyframes: string[] = [];
  let remaining = "";
  let cursor = 0;
  const regex = /@(?:-webkit-)?keyframes\s+[\w-]+/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(css))) {
    const start = match.index;
    const braceStart = css.indexOf("{", regex.lastIndex);

    if (braceStart === -1) continue;

    let depth = 0;
    let end = braceStart;

    while (end < css.length) {
      const char = css[end];
      if (char === "{") depth += 1;
      if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          end += 1;
          break;
        }
      }
      end += 1;
    }

    remaining += css.slice(cursor, start);
    keyframes.push(css.slice(start, end));
    cursor = end;
    regex.lastIndex = end;
  }

  remaining += css.slice(cursor);
  return { keyframes, remaining };
};

const extractRuleBodies = (css: string) => {
  const bodies = Array.from(css.matchAll(/\{([^{}]+)\}/g))
    .map((match) => match[1].trim())
    .filter(Boolean);

  return bodies.length > 0 ? bodies.join(";") : css;
};

const isAllowedAssetUrl = (url: string) => {
  const cleaned = url.trim().replace(/^['"]|['"]$/g, "");
  return /^https?:\/\//i.test(cleaned) && /\.(gif|png|jpe?g|webp|svg|avif)(\?.*)?$/i.test(cleaned);
};

const isBlockedValue = (value: string) => {
  if (/expression\s*\(/i.test(value)) return true;
  if (/javascript:/i.test(value)) return true;
  if (/@import/i.test(value)) return true;

  const urlMatches = Array.from(value.matchAll(/url\(([^)]+)\)/gi));
  if (urlMatches.length > 0 && !/(linear-gradient|radial-gradient|conic-gradient)/i.test(value)) {
    return urlMatches.some((match) => !isAllowedAssetUrl(match[1]));
  }

  return false;
};

export const sanitizeUsernameCss = (css: string, scopePrefix = "username") => {
  const style: CSSProperties = {};
  const { keyframes, remaining } = extractKeyframes(css);
  const declarationSource = extractRuleBodies(remaining);
  const scopedNames = new Map<string, string>();

  const scopedKeyframes = keyframes.map((block, index) => {
    const nameMatch = block.match(/@(?:-webkit-)?keyframes\s+([\w-]+)/i);
    if (!nameMatch) return block;

    const originalName = nameMatch[1];
    const scopedName = `${scopePrefix}-${originalName}-${index}`;
    scopedNames.set(originalName, scopedName);

    return block.replace(originalName, scopedName);
  });

  for (const declaration of splitDeclarations(declarationSource)) {
    const colonIndex = declaration.indexOf(":");
    if (colonIndex === -1) continue;

    const prop = declaration.slice(0, colonIndex).trim().toLowerCase();
    let value = declaration.slice(colonIndex + 1).trim();

    if (!value || isBlockedValue(value)) continue;

    scopedNames.forEach((scopedName, originalName) => {
      value = value.replace(new RegExp(`\\b${escapeRegExp(originalName)}\\b`, "g"), scopedName);
    });

    const reactProp = ALLOWED_PROPS[prop];
    if (!reactProp) continue;

    (style as Record<string, string>)[reactProp] = value;
  }

  // Restrict font-size to avoid layout jumps
  if (style.fontSize) {
    const sizeNum = parseInt(String(style.fontSize), 10);
    if (isNaN(sizeNum) || sizeNum > 16) {
      delete style.fontSize;
    }
  }

  // Restrict line-height to avoid layout jumps
  if (style.lineHeight) {
    delete style.lineHeight;
  }

  if (Object.keys(style).length > 0) {
    style.display = "inline-block";
  }

  return {
    style,
    keyframes: scopedKeyframes.join("\n"),
  };
};