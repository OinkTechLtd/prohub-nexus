import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2, CheckCircle } from "lucide-react";

interface TwoFactorSetupProps {
  onComplete: () => void;
}

export default function TwoFactorSetup({ onComplete }: TwoFactorSetupProps) {
  const [step, setStep] = useState<"enroll" | "verify">("enroll");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    enrollMFA();
  }, []);

  const enrollMFA = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "ProHub Authenticator",
      });

      if (error) throw error;

      if (data.totp) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setStep("verify");
      }
    } catch (error: any) {
      toast({
        title: "Ошибка настройки 2FA",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndActivate = async () => {
    if (verifyCode.length !== 6) {
      toast({ title: "Введите 6-значный код", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      // Verify
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      toast({ title: "2FA успешно настроен!" });
      onComplete();
    } catch (error: any) {
      toast({
        title: "Ошибка проверки",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <Shield className="h-12 w-12 mx-auto text-primary mb-2" />
        <CardTitle>Настройка двухфакторной аутентификации</CardTitle>
        <CardDescription>
          Для безопасности вашего аккаунта необходимо настроить 2FA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && step === "enroll" ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : step === "verify" ? (
          <>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Отсканируйте QR-код в приложении Google Authenticator, Authy или 1Password
              </p>
              {qrCode && (
                <img src={qrCode} alt="QR Code" className="mx-auto border rounded-lg" />
              )}
              <details className="mt-4 text-left">
                <summary className="text-sm text-muted-foreground cursor-pointer">
                  Не можете отсканировать? Введите код вручную
                </summary>
                <code className="block mt-2 p-2 bg-muted rounded text-xs break-all">
                  {secret}
                </code>
              </details>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verify-code">Код из приложения</Label>
              <Input
                id="verify-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest"
              />
            </div>

            <Button onClick={verifyAndActivate} className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Подтвердить и включить 2FA
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
