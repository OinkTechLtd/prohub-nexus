import { Crown, Flame, Star, Heart, Sparkles, Shield, Zap, Gem } from "lucide-react";

export const FLAIR_ICONS: Record<string, { Icon: any; color: string; label: string }> = {
  crown: { Icon: Crown, color: "text-yellow-400", label: "Корона" },
  flame: { Icon: Flame, color: "text-orange-500", label: "Огонь" },
  star: { Icon: Star, color: "text-amber-300", label: "Звезда" },
  heart: { Icon: Heart, color: "text-pink-500", label: "Сердце" },
  sparkles: { Icon: Sparkles, color: "text-purple-400", label: "Искры" },
  shield: { Icon: Shield, color: "text-blue-400", label: "Щит" },
  zap: { Icon: Zap, color: "text-yellow-300", label: "Молния" },
  gem: { Icon: Gem, color: "text-cyan-400", label: "Алмаз" },
};

interface FlairProps {
  prefix?: string | null;
  suffix?: string | null;
  icon?: string | null;
  size?: "sm" | "md";
}

/**
 * Декорации никнейма: эмодзи-префикс/суффикс и иконка-флейр.
 * Хранятся отдельно от ника, но визуально приклеиваются.
 */
export const UsernameFlair = ({ prefix, suffix, icon, size = "sm" }: FlairProps) => {
  const iconSize = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  const flair = icon ? FLAIR_ICONS[icon] : null;
  return (
    <>
      {prefix && <span aria-hidden className="select-none">{prefix}</span>}
      {flair && <flair.Icon className={`${iconSize} ${flair.color} inline-block`} />}
      {suffix && <span aria-hidden className="select-none">{suffix}</span>}
    </>
  );
};

export default UsernameFlair;
