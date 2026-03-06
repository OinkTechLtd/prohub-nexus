import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

/**
 * Hook that checks if the current user has 2FA enabled.
 * If not, redirects to profile settings to set it up.
 * Returns a guard function that should be called before any content action.
 */
export const use2FAGuard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  const check2FA = useCallback(async (): Promise<boolean> => {
    setChecking(true);
    try {
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const verifiedFactors = factorsData?.totp?.filter((f) => f.status === "verified") || [];

      if (verifiedFactors.length === 0) {
        toast({
          title: "Требуется 2FA",
          description: "Для выполнения этого действия необходимо включить двухфакторную аутентификацию в настройках профиля.",
          variant: "destructive",
        });
        navigate("/profile");
        return false;
      }

      return true;
    } catch (error) {
      console.error("2FA check error:", error);
      return true; // Allow action if check fails
    } finally {
      setChecking(false);
    }
  }, [toast, navigate]);

  return { check2FA, checking };
};
