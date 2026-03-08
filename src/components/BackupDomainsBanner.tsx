import { useState } from "react";
import { X, Shield, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const BackupDomainsBanner = () => {
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem("backup-banner-dismissed") === "true";
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem("backup-banner-dismissed", "true");
    setDismissed(true);
  };

  const mirrors = [
    { label: "prohub-nexus.vercel.app", url: "https://prohub-nexus.vercel.app" },
    { label: "prohub-forumru.vercel.app", url: "https://prohub-forumru.vercel.app" },
    { label: "prohubforumru.netlify.app", url: "https://prohubforumru.netlify.app" },
  ];

  return (
    <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-b border-primary/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              🔒 Резервные зеркала — не потеряйте доступ к форуму!
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {mirrors.map((mirror) => (
                <a
                  key={mirror.url}
                  href={mirror.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors border border-primary/20"
                >
                  <ExternalLink className="h-3 w-3" />
                  {mirror.label}
                </a>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Список будет пополняться • Следите за обновлениями в нашем{" "}
              <a
                href="https://vk.com/prohub_forum"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                ВК сообществе
              </a>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BackupDomainsBanner;
