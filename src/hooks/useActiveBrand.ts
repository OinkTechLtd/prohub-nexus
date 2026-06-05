import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const KEY = "active_brand_id";

/**
 * Tracks which brand account is "active" for the current user.
 * Stored in localStorage; null means personal account.
 */
export function useActiveBrand() {
  const [activeBrandId, setActiveBrandIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(KEY);
  });
  const [activeBrand, setActiveBrand] = useState<any>(null);

  useEffect(() => {
    if (!activeBrandId) {
      setActiveBrand(null);
      return;
    }
    supabase
      .from("brand_accounts")
      .select("*")
      .eq("id", activeBrandId)
      .maybeSingle()
      .then(({ data }) => setActiveBrand(data));
  }, [activeBrandId]);

  const setActiveBrandId = (id: string | null) => {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
    setActiveBrandIdState(id);
    window.dispatchEvent(new Event("active-brand-changed"));
  };

  useEffect(() => {
    const handler = () => {
      const v = localStorage.getItem(KEY);
      setActiveBrandIdState(v);
    };
    window.addEventListener("active-brand-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("active-brand-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { activeBrandId, activeBrand, setActiveBrandId };
}
