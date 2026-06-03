import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Каталог стикеров — выбор как «флаг страны», только это эмодзи-стикеры,
 * которые рендерятся в квадратике после ника (liquid-glass).
 */
export const STICKER_CATALOG: { id: string; emoji: string; label: string }[] = [
  { id: "fire", emoji: "🔥", label: "Огонь" },
  { id: "crown", emoji: "👑", label: "Корона" },
  { id: "star", emoji: "⭐", label: "Звезда" },
  { id: "diamond", emoji: "💎", label: "Алмаз" },
  { id: "rocket", emoji: "🚀", label: "Ракета" },
  { id: "lightning", emoji: "⚡", label: "Молния" },
  { id: "heart", emoji: "❤️", label: "Сердце" },
  { id: "sparkles", emoji: "✨", label: "Искры" },
  { id: "rainbow", emoji: "🌈", label: "Радуга" },
  { id: "ghost", emoji: "👻", label: "Призрак" },
  { id: "alien", emoji: "👽", label: "Пришелец" },
  { id: "robot", emoji: "🤖", label: "Робот" },
  { id: "frog", emoji: "🐸", label: "Лягушка" },
  { id: "cat", emoji: "🐱", label: "Кот" },
  { id: "panda", emoji: "🐼", label: "Панда" },
  { id: "unicorn", emoji: "🦄", label: "Единорог" },
  { id: "wolf", emoji: "🐺", label: "Волк" },
  { id: "tiger", emoji: "🐯", label: "Тигр" },
  { id: "trophy", emoji: "🏆", label: "Кубок" },
  { id: "medal", emoji: "🥇", label: "Медаль" },
  { id: "shield", emoji: "🛡️", label: "Щит" },
  { id: "sword", emoji: "⚔️", label: "Меч" },
  { id: "skull", emoji: "💀", label: "Череп" },
  { id: "moon", emoji: "🌙", label: "Луна" },
  { id: "sun", emoji: "☀️", label: "Солнце" },
  { id: "snowflake", emoji: "❄️", label: "Снежинка" },
  { id: "leaf", emoji: "🍀", label: "Клевер" },
  { id: "flower", emoji: "🌸", label: "Сакура" },
];

interface Props {
  value: string;
  onChange: (sticker: string) => void;
}

const StickerPicker = ({ value, onChange }: Props) => {
  const [showCustom, setShowCustom] = useState(false);
  const isCustom = value && !STICKER_CATALOG.some((s) => s.emoji === value);

  return (
    <div className="space-y-3">
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(2.25rem, 1fr))" }}
      >
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Без стикера"
          className={`aspect-square rounded-md border text-xs flex items-center justify-center transition-all ${
            !value
              ? "border-primary bg-primary/15 ring-2 ring-primary/40"
              : "border-border hover:border-primary/60"
          }`}
        >
          —
        </button>
        {STICKER_CATALOG.map((s) => (
          <button
            type="button"
            key={s.id}
            onClick={() => onChange(s.emoji)}
            title={s.label}
            aria-label={s.label}
            className={`aspect-square rounded-md border text-lg flex items-center justify-center transition-all hover-scale ${
              value === s.emoji
                ? "border-primary bg-primary/15 ring-2 ring-primary/40"
                : "border-border hover:border-primary/60"
            }`}
          >
            {s.emoji}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={showCustom || isCustom ? "default" : "outline"}
          onClick={() => setShowCustom((v) => !v)}
        >
          {showCustom || isCustom ? "Свой стикер" : "+ свой"}
        </Button>
        {(showCustom || isCustom) && (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={300}
            placeholder="эмодзи или https://...png"
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
        )}
      </div>
    </div>
  );
};

export default StickerPicker;
