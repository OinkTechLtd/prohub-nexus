import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PushNotificationToggleProps {
  userId: string | undefined;
}

export default function PushNotificationToggle({ userId }: PushNotificationToggleProps) {
  const { isSupported, isSubscribed, permission, subscribe, unsubscribe } = usePushNotifications(userId);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!isSupported) return null;

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
        toast({ title: "Push-уведомления отключены" });
      } else {
        const success = await subscribe();
        if (success) {
          toast({ title: "Push-уведомления включены!" });
        } else if (permission === "denied") {
          toast({
            title: "Уведомления заблокированы",
            description: "Разрешите уведомления в настройках браузера",
            variant: "destructive",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={isSubscribed ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      {isSubscribed ? "Уведомления вкл." : "Включить уведомления"}
    </Button>
  );
}
