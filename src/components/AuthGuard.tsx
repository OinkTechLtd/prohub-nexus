import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
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
        setIsChecking(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Check if user is protected
      const { data: protectedUser } = await supabase
        .from("protected_users")
        .select("protection_type")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (protectedUser) {
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

      // Check 2FA: if user has verified TOTP factors, ensure AAL2
      try {
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const verifiedFactors = factorsData?.totp?.filter((f) => f.status === "verified") || [];

        if (verifiedFactors.length > 0) {
          const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          
          if (aalData?.currentLevel === "aal1" && aalData?.nextLevel === "aal2") {
            // User has 2FA but hasn't verified yet - redirect to auth
            navigate("/auth");
            setIsAuthorized(false);
            setIsChecking(false);
            return;
          }
        }
      } catch (e) {
        console.error("2FA check error:", e);
      }

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

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
