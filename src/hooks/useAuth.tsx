import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const AUTH_REHYDRATION_DELAY_MS = 400;
const AUTH_REHYDRATION_MAX_RETRIES = 8;

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
  const lastStableSessionRef = useRef<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    const clearRehydrationTimeout = () => {
      if (rehydrationTimeoutRef.current !== null) {
        window.clearTimeout(rehydrationTimeoutRef.current);
        rehydrationTimeoutRef.current = null;
      }
    };

    const beginRehydration = () => {
      if (!mounted) return;
      setLoading(true);
      setAuthReady(false);
    };

    const commitSession = (nextSession: Session | null) => {
      if (!mounted) return;
      clearRehydrationTimeout();
      if (nextSession) {
        lastStableSessionRef.current = nextSession;
      }
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setAuthReady(true);
      setLoading(false);
    };

    const scheduleRehydrationCheck = (attempt = 0) => {
      clearRehydrationTimeout();
      rehydrationTimeoutRef.current = window.setTimeout(() => {
        void supabase.auth.getSession()
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

            if (lastStableSessionRef.current) {
              commitSession(lastStableSessionRef.current);
              return;
            }

            commitSession(null);
          })
          .catch(() => {
            if (!mounted) return;

            if (attempt < AUTH_REHYDRATION_MAX_RETRIES - 1) {
              scheduleRehydrationCheck(attempt + 1);
              return;
            }

            if (lastStableSessionRef.current) {
              commitSession(lastStableSessionRef.current);
              return;
            }

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
        lastStableSessionRef.current = null;
        commitSession(null);
        return;
      }

      console.warn("[Auth] Delaying null session until rehydration completes:", event);
      beginRehydration();
      scheduleRehydrationCheck();
    });

    void supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        if (initialSession) {
          commitSession(initialSession);
          return;
        }

        beginRehydration();
        scheduleRehydrationCheck();
      })
      .catch(() => {
        if (!mounted) return;
        beginRehydration();
        scheduleRehydrationCheck();
      });

    return () => {
      mounted = false;
      clearRehydrationTimeout();
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    lastStableSessionRef.current = null;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, authReady, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
