import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    
    // Show again after 7 days
    if (dismissed && daysSinceDismissed < 7) {
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after 5 seconds
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
    setShowPrompt(false);
  };

  if (isInstalled || !deferredPrompt) return null;

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Установите ProHub
          </DialogTitle>
          <DialogDescription>
            Установите наше приложение на устройство для быстрого доступа к форуму и получения уведомлений о новостях проекта.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 py-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Download className="h-4 w-4" />
            <span>Работает без интернета</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Smartphone className="h-4 w-4" />
            <span>Как настоящее приложение</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDismiss}>
            Позже
          </Button>
          <Button onClick={handleInstall} className="gap-2">
            <Download className="h-4 w-4" />
            Установить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PWAInstallPrompt;
