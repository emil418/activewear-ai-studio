import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useAdmin = () => {
  const { user, authReady } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authReady || !user?.email) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from("admin_allowlist")
        .select("id")
        .eq("email", user.email!.toLowerCase())
        .limit(1)
        .maybeSingle();
      setIsAdmin(!!data);
      setLoading(false);
    };

    check();
  }, [authReady, user?.email]);

  return { isAdmin, loading };
};
