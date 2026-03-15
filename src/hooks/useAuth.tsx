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
    // Get initial session first, before subscribing to changes
    let initialised = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      initialised = true;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Don't clear an existing session on transient token errors
      // Only clear on explicit sign-out or user deletion
      if (!session && event !== 'SIGNED_OUT' && user) {
        // Likely a rate-limit / transient failure — keep existing session
        console.warn('[Auth] Transient auth event with null session, keeping current user:', event);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (initialised) {
        // Only update loading after initial session is set
      } else {
        setLoading(false);
        initialised = true;
      }
    });

    return () => subscription.unsubscribe();
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
