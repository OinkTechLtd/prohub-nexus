import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2 } from "lucide-react";

interface TwoFactorVerifyProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TwoFactorVerify({ onSuccess, onCancel }: TwoFactorVerifyProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast({ title: "Введите 6-значный код", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Get the TOTP factor
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

      if (factorsError) throw factorsError;

      const totpFactor = factorsData?.totp?.[0];
      if (!totpFactor) {
        throw new Error("TOTP не настроен");
      }

      // Challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

      if (challengeError) throw challengeError;

      // Verify
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) throw verifyError;

      toast({ title: "Вход выполнен!" });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Неверный код",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onCancel();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <Shield className="h-12 w-12 mx-auto text-primary mb-2" />
        <CardTitle>Двухфакторная аутентификация</CardTitle>
        <CardDescription>
          Введите 6-значный код из вашего приложения-аутентификатора
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="2fa-code">Код</Label>
          <Input
            id="2fa-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="text-center text-2xl tracking-widest"
            autoFocus
          />
        </div>

        <Button onClick={handleVerify} className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Подтвердить
        </Button>

        <Button variant="ghost" onClick={handleLogout} className="w-full">
          Выйти
        </Button>
      </CardContent>
    </Card>
  );
}
