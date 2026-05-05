import { EyeOff } from "lucide-react";

interface Props {
  reason?: string | null;
  className?: string;
}

/**
 * Плашка "контент скрыт", аналог BannedUserBadge.
 */
const HiddenContentBanner = ({ reason, className = "" }: Props) => {
  return (
    <div
      className={`flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm ${className}`}
      role="alert"
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive">
        <EyeOff className="h-4 w-4 text-destructive-foreground" />
      </span>
      <p className="text-destructive-foreground/90 leading-snug">
        <strong>Этот материал был скрыт модерацией.</strong>
        {reason ? <> Причина: <em>{reason}</em></> : null}
      </p>
    </div>
  );
};

export default HiddenContentBanner;
