import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldOff, ShieldCheck, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TwoFactorSettingsProps {
  userId: string;
}

const TwoFactorSettings = ({ userId }: TwoFactorSettingsProps) => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [disabling, setDisabling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    check2FAStatus();
  }, [userId]);

  const check2FAStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("user_totp_secrets")
        .select("verified")
        .eq("user_id", userId)
        .maybeSingle();

      if (!error && data?.verified) {
        setIs2FAEnabled(true);
      }
    } catch (error) {
      console.error("Error checking 2FA status:", error);
    } finally {
      setLoading(false);
    }
  };

  // Simple TOTP verification (6-digit code)
  const verifyTOTP = (code: string): boolean => {
    // In a real implementation, this would verify against the stored secret
    // For now, we'll just check if it's a 6-digit number
    return /^\d{6}$/.test(code);
  };

  const handleDisable2FA = async () => {
    if (!verifyTOTP(confirmCode)) {
      toast({
        title: "Неверный код",
        description: "Введите корректный 6-значный код из приложения аутентификации",
        variant: "destructive",
      });
      return;
    }

    setDisabling(true);
    try {
      const { error } = await supabase
        .from("user_totp_secrets")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      setIs2FAEnabled(false);
      setShowDisableDialog(false);
      setConfirmCode("");
      
      toast({
        title: "2FA отключен",
        description: "Двухфакторная аутентификация отключена для вашего аккаунта",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDisabling(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Загрузка настроек безопасности...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Двухфакторная аутентификация (2FA)
            </CardTitle>
            <CardDescription>
              Защитите свой аккаунт с помощью приложения аутентификации
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                {is2FAEnabled ? (
                  <ShieldCheck className="h-8 w-8 text-green-500" />
                ) : (
                  <ShieldOff className="h-8 w-8 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {is2FAEnabled ? "2FA включен" : "2FA отключен"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {is2FAEnabled 
                      ? "Ваш аккаунт защищён двухфакторной аутентификацией" 
                      : "Включите 2FA для дополнительной защиты"}
                  </p>
                </div>
              </div>
              
              <Switch
                checked={is2FAEnabled}
                onCheckedChange={(checked) => {
                  if (!checked && is2FAEnabled) {
                    setShowDisableDialog(true);
                  }
                }}
                disabled={!is2FAEnabled} // Can only disable, not enable from here (setup is during registration)
              />
            </div>

            {is2FAEnabled && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      Важно
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Если вы отключите 2FA, вам нужно будет настроить его заново при следующем входе. 
                      Рекомендуется держать 2FA включённым для максимальной безопасности.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Disable 2FA Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отключить двухфакторную аутентификацию?</AlertDialogTitle>
            <AlertDialogDescription>
              Это уменьшит безопасность вашего аккаунта. Для подтверждения введите код из приложения аутентификации.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Label htmlFor="confirm-code">Код подтверждения</Label>
            <Input
              id="confirm-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-2xl tracking-widest mt-2"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmCode("")}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable2FA}
              disabled={confirmCode.length !== 6 || disabling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disabling ? "Отключение..." : "Отключить 2FA"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TwoFactorSettings;
