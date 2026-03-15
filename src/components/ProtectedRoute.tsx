import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [rehydrationChecked, setRehydrationChecked] = useState(false);
  const [rehydrationHasUser, setRehydrationHasUser] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (loading) return;

    if (user) {
      setRehydrationHasUser(true);
      setRehydrationChecked(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setRehydrationHasUser(!!session?.user);
      setRehydrationChecked(true);
    });

    return () => {
      mounted = false;
    };
  }, [loading, user]);

  if (loading || (!user && !rehydrationChecked)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-display font-bold tracking-widest uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !rehydrationHasUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
