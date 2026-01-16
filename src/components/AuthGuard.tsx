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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Not logged in - allow access (public pages)
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Check if user is protected (should not be logged in at all)
      const { data: protectedUser } = await supabase
        .from("protected_users")
        .select("protection_type")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (protectedUser) {
        // Force logout for protected accounts
        await supabase.auth.signOut();
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Check MFA status
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const totpFactors = factorsData?.totp || [];
      const verifiedFactors = totpFactors.filter((f) => f.status === "verified");

      if (verifiedFactors.length === 0) {
        // No 2FA set up - redirect to auth for setup (unless already there)
        if (location.pathname !== "/auth") {
          navigate("/auth", { replace: true });
          return;
        }
      } else {
        // 2FA is set up - check current AAL level
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        
        if (aalData?.currentLevel === "aal1" && aalData?.nextLevel === "aal2") {
          // Need to verify 2FA - redirect to auth (unless already there)
          if (location.pathname !== "/auth") {
            navigate("/auth", { replace: true });
            return;
          }
        }
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
