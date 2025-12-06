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
import { Download, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canShow, setCanShow] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check for iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    
    // Show again after 3 days
    if (dismissed && daysSinceDismissed < 3) {
      return;
    }

    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      console.log("PWA: beforeinstallprompt event fired");
      setDeferredPrompt(e);
      setCanShow(true);
      // Show prompt after 3 seconds on first visit
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // For iOS, show manual installation instructions
    if (isIOS && !dismissed) {
      setTimeout(() => {
        setShowPrompt(true);
        setCanShow(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log("PWA: User choice:", outcome);
      
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
    setShowPrompt(false);
  };

  // Show for iOS or when we have the deferred prompt
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  if (isInstalled) return null;
  if (!canShow && !isIOS) return null;

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
          
          {isIOS && !deferredPrompt && (
            <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-2">Для iOS:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Нажмите кнопку «Поделиться» в Safari</li>
                <li>Выберите «На экран Домой»</li>
                <li>Нажмите «Добавить»</li>
              </ol>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDismiss}>
            Позже
          </Button>
          {deferredPrompt ? (
            <Button onClick={handleInstall} className="gap-2">
              <Download className="h-4 w-4" />
              Установить
            </Button>
          ) : (
            <Button onClick={handleDismiss} className="gap-2">
              Понятно
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PWAInstallPrompt;
