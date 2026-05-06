import { useEffect, useMemo, useState } from "react";
import { Snowflake, Sparkles, Sun } from "lucide-react";

/**
 * Сезонный отсчёт в стиле BLESS RUSSIA: до зимы (1 ноября) и до лета (1 июня).
 * Лето: январь–июнь → отсчёт до 1 июня; иначе → отсчёт до 1 ноября.
 */
const getTarget = (now: Date, monthIndex: number, day = 1) => {
  const year = now.getFullYear();
  const target = new Date(year, monthIndex, day, 0, 0, 0);
  return target.getTime() <= now.getTime() ? new Date(year + 1, monthIndex, day, 0, 0, 0) : target;
};

const splitDiff = (target: Date, now: Date) => {
  const diff = Math.max(0, target.getTime() - now.getTime());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
};

const SeasonalCountdown = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const month = now.getMonth();
  const isSummerMode = month <= 4 || month >= 10;
  const primary = useMemo(() => {
    const summer = getTarget(now, 5, 1);
    const winter = getTarget(now, 10, 1);
    return isSummerMode
      ? { label: "До лета", year: summer.getFullYear(), icon: Sun, kind: "summer" as const, value: splitDiff(summer, now), secondary: { label: "До зимы", value: splitDiff(winter, now) } }
      : { label: "До зимы", year: winter.getFullYear(), icon: Snowflake, kind: "winter" as const, value: splitDiff(winter, now), secondary: { label: "До лета", value: splitDiff(summer, now) } };
  }, [isSummerMode, now]);

  const Icon = primary.icon;
  const time = primary.value;

  return (
    <div className={`seasonal-countdown seasonal-countdown--${primary.kind}`}>
      <div className="seasonal-countdown__shine" aria-hidden="true" />
      <div className="seasonal-countdown__flakes" aria-hidden="true">✦ ✧ ✦ ✧ ✦</div>
      <div className="seasonal-countdown__head">
        <Icon className="seasonal-countdown__icon" />
        <div className="min-w-0">
          <div className="seasonal-countdown__title">{primary.label} осталось</div>
          <div className="seasonal-countdown__year"><Sparkles className="h-3.5 w-3.5" /> {primary.year}</div>
        </div>
      </div>
      <div className="seasonal-countdown__grid" aria-label={`${primary.label} осталось`}>
        {[
          [time.days, "Дней"],
          [time.hours, "Часов"],
          [time.minutes, "Мин"],
          [time.seconds, "Сек"],
        ].map(([value, label]) => (
          <div className="seasonal-countdown__cell" key={label}>
            <span className="seasonal-countdown__number">{String(value).padStart(2, "0")}</span>
            <span className="seasonal-countdown__label">{label}</span>
          </div>
        ))}
      </div>
      <div className="seasonal-countdown__subline">
        {primary.secondary.label}: {primary.secondary.value.days}д {String(primary.secondary.value.hours).padStart(2, "0")}ч
      </div>
    </div>
  );
};

export default SeasonalCountdown;
