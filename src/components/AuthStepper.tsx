import { Check, Mail, ShieldCheck, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

export type AuthStep = "register" | "email" | "2fa" | "done";

interface Props {
  current: AuthStep;
}

const STEPS: { key: AuthStep; label: string; icon: any }[] = [
  { key: "register", label: "Регистрация", icon: LogIn },
  { key: "email", label: "Email", icon: Mail },
  { key: "2fa", label: "2FA", icon: ShieldCheck },
  { key: "done", label: "Готово", icon: Check },
];

export default function AuthStepper({ current }: Props) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center justify-between gap-1 mb-4 px-1">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const active = i === idx;
        const done = i < idx;
        return (
          <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors",
                done && "bg-primary border-primary text-primary-foreground",
                active && "border-primary text-primary",
                !done && !active && "border-muted text-muted-foreground"
              )}
            >
              {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </div>
            <span
              className={cn(
                "text-[10px] sm:text-xs text-center",
                active ? "text-foreground font-semibold" : "text-muted-foreground"
              )}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="hidden" />
            )}
          </div>
        );
      })}
    </div>
  );
}
