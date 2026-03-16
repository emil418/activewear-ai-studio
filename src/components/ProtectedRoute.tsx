import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, authReady } = useAuth();
  const [sessionCheckPending, setSessionCheckPending] = useState(false);
  const [sessionExists, setSessionExists] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!authReady || user) {
      setSessionCheckPending(false);
      setSessionExists(false);
      return;
    }

    setSessionCheckPending(true);

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setSessionExists(!!session?.user);
      setSessionCheckPending(false);
    });

    return () => {
      cancelled = true;
    };
  }, [authReady, user]);

  if (loading || !authReady || sessionCheckPending || sessionExists) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-display font-bold tracking-widest uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
