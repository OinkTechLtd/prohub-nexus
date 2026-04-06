import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const ROLE_BORDER_COLORS: Record<string, string> = {
  admin: "ring-red-500",
  moderator: "ring-blue-500",
  editor: "ring-purple-500",
  pro: "ring-yellow-500",
  newbie: "ring-gray-400",
};

const ROLE_GLOW: Record<string, string> = {
  admin: "shadow-[0_0_8px_rgba(239,68,68,0.5)]",
  moderator: "shadow-[0_0_8px_rgba(59,130,246,0.5)]",
  editor: "shadow-[0_0_8px_rgba(168,85,247,0.5)]",
  pro: "shadow-[0_0_6px_rgba(234,179,8,0.4)]",
  newbie: "",
};

interface AvatarWithBorderProps {
  src?: string | null;
  fallback: string;
  role?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 ring-[2px]",
  md: "h-10 w-10 ring-2",
  lg: "h-16 w-16 ring-[3px]",
  xl: "h-24 w-24 ring-4",
};

const AvatarWithBorder = ({
  src,
  fallback,
  role = "newbie",
  size = "md",
  className,
}: AvatarWithBorderProps) => {
  const borderColor = ROLE_BORDER_COLORS[role] || ROLE_BORDER_COLORS.newbie;
  const glow = ROLE_GLOW[role] || "";

  return (
    <Avatar
      className={cn(
        sizeClasses[size],
        "ring-offset-2 ring-offset-background",
        borderColor,
        glow,
        className
      )}
    >
      <AvatarImage src={src || undefined} />
      <AvatarFallback className="bg-muted text-xs">
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
};

export default AvatarWithBorder;
