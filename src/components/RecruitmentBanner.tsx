import { Link } from "react-router-dom";
import { Users, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const RecruitmentBanner = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem("recruitment-banner-dismissed");
    if (dismissed) {
      setVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("recruitment-banner-dismissed", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-primary/90 to-primary text-primary-foreground py-2 px-4">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <Users className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong>Нужны Редакторы и Модераторы Форума!</strong> Писать в ЛС:{" "}
            <Link
              to="/profile/Twixoff"
              className="underline hover:no-underline font-semibold"
            >
              @Twixoff
            </Link>
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-primary-foreground/20"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default RecruitmentBanner;
