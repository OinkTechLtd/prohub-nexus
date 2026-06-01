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
  sticker?: string | null;
  size?: "sm" | "md";
}

/**
 * Декорации никнейма: эмодзи-префикс/суффикс, иконка-флейр и стикер
 * (картинка/эмодзи в полупрозрачном квадрате после ника).
 */
export const UsernameFlair = ({ prefix, suffix, icon, sticker, size = "sm" }: FlairProps) => {
  const iconSize = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  const stickerBox = size === "md" ? "h-5 w-5" : "h-4 w-4";
  const flair = icon ? FLAIR_ICONS[icon] : null;
  const isImageUrl = !!sticker && /^https?:\/\//i.test(sticker);

  return (
    <>
      {prefix && <span aria-hidden className="select-none">{prefix}</span>}
      {flair && <flair.Icon className={`${iconSize} ${flair.color} inline-block`} />}
      {suffix && <span aria-hidden className="select-none">{suffix}</span>}
      {sticker && (
        <span
          aria-hidden
          className={`ml-0.5 inline-flex ${stickerBox} items-center justify-center rounded-[4px] bg-white/15 backdrop-blur-sm ring-1 ring-white/20 overflow-hidden align-middle`}
          title="Стикер"
        >
          {isImageUrl ? (
            <img src={sticker} alt="" className="h-full w-full object-contain" loading="lazy" />
          ) : (
            <span className="text-[11px] leading-none">{sticker.slice(0, 2)}</span>
          )}
        </span>
      )}
    </>
  );
};

export default UsernameFlair;
