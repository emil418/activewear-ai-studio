import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const AUTH_REHYDRATION_DELAY_MS = 250;
const AUTH_REHYDRATION_MAX_RETRIES = 3;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authReady: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  authReady: false,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const rehydrationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const clearRehydrationTimeout = () => {
      if (rehydrationTimeoutRef.current !== null) {
        window.clearTimeout(rehydrationTimeoutRef.current);
        rehydrationTimeoutRef.current = null;
      }
    };

    const commitSession = (nextSession: Session | null) => {
      if (!mounted) return;
      clearRehydrationTimeout();
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setAuthReady(true);
      setLoading(false);
    };

    const scheduleRehydrationCheck = (attempt = 0) => {
      clearRehydrationTimeout();
      rehydrationTimeoutRef.current = window.setTimeout(() => {
        supabase.auth.getSession()
          .then(({ data: { session: latestSession } }) => {
            if (!mounted) return;

            if (latestSession) {
              commitSession(latestSession);
              return;
            }

            if (attempt < AUTH_REHYDRATION_MAX_RETRIES - 1) {
              scheduleRehydrationCheck(attempt + 1);
              return;
            }

            commitSession(null);
          })
          .catch(() => {
            if (!mounted) return;
            commitSession(null);
          });
      }, AUTH_REHYDRATION_DELAY_MS);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (nextSession) {
        commitSession(nextSession);
        return;
      }

      if (event === "SIGNED_OUT") {
        commitSession(null);
        return;
      }

      console.warn("[Auth] Delaying null session until rehydration completes:", event);
      scheduleRehydrationCheck();
    });

    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        if (initialSession) {
          commitSession(initialSession);
          return;
        }

        scheduleRehydrationCheck();
      })
      .catch(() => {
        if (!mounted) return;
        commitSession(null);
      });

    return () => {
      mounted = false;
      clearRehydrationTimeout();
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, authReady, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
