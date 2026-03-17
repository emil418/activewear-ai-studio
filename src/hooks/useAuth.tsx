import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
  const lastStableSessionRef = useRef<Session | null>(null);
  const initialResolutionCompleteRef = useRef(false);
  const nullSessionValidationInFlightRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const markReady = () => {
      if (!mounted) return;
      setLoading(false);
      setAuthReady(true);
    };

    const commitSession = (nextSession: Session | null) => {
      if (!mounted) return;

      if (nextSession) {
        lastStableSessionRef.current = nextSession;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      setAuthReady(true);
    };

    const resolveNullSession = () => {
      if (nullSessionValidationInFlightRef.current) return;
      nullSessionValidationInFlightRef.current = true;

      void supabase.auth.getSession()
        .then(({ data: { session: restoredSession } }) => {
          if (!mounted) return;

          if (restoredSession) {
            commitSession(restoredSession);
            return;
          }

          lastStableSessionRef.current = null;
          commitSession(null);
        })
        .catch(() => {
          if (!mounted) return;

          if (lastStableSessionRef.current) {
            commitSession(lastStableSessionRef.current);
            return;
          }

          commitSession(null);
        })
        .finally(() => {
          nullSessionValidationInFlightRef.current = false;
        });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        initialResolutionCompleteRef.current = true;
        lastStableSessionRef.current = null;
        commitSession(null);
        return;
      }

      if (nextSession) {
        initialResolutionCompleteRef.current = true;
        commitSession(nextSession);
        return;
      }

      if (!initialResolutionCompleteRef.current) {
        return;
      }

      if (lastStableSessionRef.current) {
        markReady();
        resolveNullSession();
        return;
      }

      commitSession(null);
    });

    void supabase.auth.getSession()
      .then(({ data: { session: restoredSession } }) => {
        if (!mounted) return;
        initialResolutionCompleteRef.current = true;
        commitSession(restoredSession ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        initialResolutionCompleteRef.current = true;
        commitSession(lastStableSessionRef.current);
      });

    return () => {
      mounted = false;
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
