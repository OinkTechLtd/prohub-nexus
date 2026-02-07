import { cn } from "@/lib/utils";

interface OnlineIndicatorProps {
  isOnline: boolean;
  className?: string;
}

const OnlineIndicator = ({ isOnline, className }: OnlineIndicatorProps) => {
  return (
    <span
      className={cn(
        "inline-block w-2.5 h-2.5 rounded-full border-2 border-background",
        isOnline ? "bg-green-500" : "bg-muted-foreground/40",
        className
      )}
      title={isOnline ? "Онлайн" : "Оффлайн"}
    />
  );
};

export default OnlineIndicator;
