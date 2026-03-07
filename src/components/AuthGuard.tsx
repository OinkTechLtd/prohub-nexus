import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import TwoFactorSetup from "./TwoFactorSetup";
import TwoFactorVerify from "./TwoFactorVerify";

const APP_VERSION = "1.0.0";
const MIN_CLIENT_VERSION = "1.0.0";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [needs2FASetup, setNeeds2FASetup] = useState(false);
  const [needs2FAVerify, setNeeds2FAVerify] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => subscription.unsubscribe();
  }, [location.pathname]);

  const checkAuth = async () => {
    try {
      // Allow /blocked and /auth pages without checks
      if (location.pathname === "/blocked" || location.pathname === "/auth") {
        setIsAuthorized(true);
        setNeeds2FASetup(false);
        setNeeds2FAVerify(false);
        setIsChecking(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthorized(true);
        setNeeds2FASetup(false);
        setNeeds2FAVerify(false);
        setIsChecking(false);
        return;
      }

      // Check if user is protected (system bot/founder)
      const { data: protectedUser } = await supabase
        .from("protected_users")
        .select("protection_type")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (protectedUser?.protection_type === "system_bot") {
        await supabase.auth.signOut();
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Check if user is banned
      const { data: activeBan } = await supabase
        .from("user_bans")
        .select("id, expires_at, ban_type")
        .eq("user_id", session.user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeBan) {
        if (activeBan.expires_at && new Date(activeBan.expires_at) < new Date()) {
          await supabase
            .from("user_bans")
            .update({ is_active: false })
            .eq("id", activeBan.id);
        } else {
          navigate("/blocked");
          setIsAuthorized(false);
          setIsChecking(false);
          return;
        }
      }

      // Check 2FA status
      try {
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const verifiedFactors = factorsData?.totp?.filter((f) => f.status === "verified") || [];

        if (verifiedFactors.length === 0) {
          // User has NO 2FA set up - force setup
          setNeeds2FASetup(true);
          setNeeds2FAVerify(false);
          setIsAuthorized(false);
          setIsChecking(false);
          return;
        }

        // User has 2FA, check if they need to verify
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        
        if (aalData?.currentLevel === "aal1" && aalData?.nextLevel === "aal2") {
          // User has 2FA but hasn't verified this session
          setNeeds2FAVerify(true);
          setNeeds2FASetup(false);
          setIsAuthorized(false);
          setIsChecking(false);
          return;
        }
      } catch (e) {
        console.error("2FA check error:", e);
      }

      setNeeds2FASetup(false);
      setNeeds2FAVerify(false);
      setIsAuthorized(true);
    } catch (error) {
      console.error("Auth guard error:", error);
      setIsAuthorized(true);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (needs2FASetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-foreground">Обязательная настройка 2FA</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Для безопасности вашего аккаунта необходимо включить двухфакторную аутентификацию
            </p>
          </div>
          <TwoFactorSetup onComplete={() => checkAuth()} />
        </div>
      </div>
    );
  }

  if (needs2FAVerify) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <TwoFactorVerify
          onSuccess={() => checkAuth()}
          onCancel={() => {
            setNeeds2FAVerify(false);
            setIsAuthorized(false);
          }}
        />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
