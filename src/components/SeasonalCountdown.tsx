import { useEffect, useState } from "react";
import { Snowflake, Sun } from "lucide-react";

/**
 * Сезонный отсчёт в стиле BLESS RUSSIA: до зимы (1 ноября) и до лета (1 июня).
 * Лето: январь–июнь → отсчёт до 1 июня; иначе → отсчёт до 1 ноября.
 */
const SeasonalCountdown = () => {
  const [now, setNow] = useState(() => new Date());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const month = now.getMonth(); // 0..11
  const year = now.getFullYear();

  // 1 января – 31 мая → лето; 1 июня – 31 октября → зима; ноябрь+декабрь → следующее лето
  let mode: "summer" | "winter" = "winter";
  let target: Date;
  if (month <= 4) {
    mode = "summer";
    target = new Date(year, 5, 1, 0, 0, 0); // 1 июня
  } else if (month <= 9) {
    mode = "winter";
    target = new Date(year, 10, 1, 0, 0, 0); // 1 ноября
  } else {
    mode = "summer";
    target = new Date(year + 1, 5, 1, 0, 0, 0);
  }

  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (dismissed) return null;

  const isSummer = mode === "summer";
  const grad = isSummer
    ? "linear-gradient(135deg, #fb923c 0%, #f59e0b 50%, #facc15 100%)"
    : "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #93c5fd 100%)";
  const Icon = isSummer ? Sun : Snowflake;

  return (
    <div className="relative w-full overflow-hidden rounded-lg shadow-lg my-3" style={{ background: grad }}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 text-white/70 hover:text-white text-xs"
        aria-label="Закрыть"
      >
        ✕
      </button>
      <div className="px-3 py-3 sm:px-4 sm:py-4 flex items-center gap-3 text-white">
        <Icon className="h-7 w-7 sm:h-9 sm:w-9 shrink-0 drop-shadow" />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] sm:text-xs uppercase tracking-wider opacity-90">
            {isSummer ? "До лета осталось" : "До зимы осталось"}
          </div>
          <div className="font-mono font-bold text-sm sm:text-lg flex flex-wrap gap-x-2 gap-y-0">
            <span><b>{days}</b>д</span>
            <span><b>{String(hours).padStart(2, "0")}</b>ч</span>
            <span><b>{String(minutes).padStart(2, "0")}</b>м</span>
            <span><b>{String(seconds).padStart(2, "0")}</b>с</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonalCountdown;
