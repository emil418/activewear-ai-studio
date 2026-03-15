import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialSessionResolved = false;

    const applySession = (nextSession: Session | null, event?: string) => {
      if (!mounted) return;

      const isExplicitLogout = event === "SIGNED_OUT" || event === "USER_DELETED";

      // Ignore transient null sessions caused by refresh token race/rate-limit issues
      if (!nextSession && !isExplicitLogout && initialSessionResolved) {
        console.warn("[Auth] Ignoring transient null session event:", event);
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!initialSessionResolved) {
        initialSessionResolved = true;
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      applySession(nextSession, event);
    });

    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => {
        applySession(initialSession, "INITIAL_SESSION");
      })
      .catch(() => {
        if (!mounted) return;
        initialSessionResolved = true;
        setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
