import { BadgeCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  className?: string;
}

const VerifiedBadge = ({ className = "" }: VerifiedBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <BadgeCheck className={`h-5 w-5 text-blue-500 fill-blue-500/20 ${className}`} />
        </TooltipTrigger>
        <TooltipContent>
          <p>Верифицированный пользователь</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerifiedBadge;
