import { supabase } from '@/services/supabase/client';
import { queryKeys } from '@/services/queryKeys';
import { clearProcessedRecoveryUrl } from '@/utils/authDeepLink';
import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  pendingPasswordRecovery: boolean;
  setPendingPasswordRecovery: (value: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  pendingPasswordRecovery: false,
  setPendingPasswordRecovery: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPasswordRecovery, setPendingPasswordRecovery] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const AUTH_TIMEOUT_MS = 10000;
    let cancelled = false;

    const timeoutId = setTimeout(() => {
      if (!cancelled) setIsLoading(false);
    }, AUTH_TIMEOUT_MS);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!cancelled) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSession(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPendingPasswordRecovery(true);
      }

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setIsLoading(false);
        await queryClient.cancelQueries();
        queryClient.clear();
      } else if (event === 'SIGNED_IN') {
        queryClient.clear();
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        if (event === 'USER_UPDATED' && session?.user?.id) {
          const userId = session.user.id;
          void (async () => {
            await queryClient.resetQueries();
            await queryClient.refetchQueries({
              queryKey: queryKeys.users.detail(userId),
            });
          })();
        }
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const signOut = async () => {
    setSession(null);
    setUser(null);
    setPendingPasswordRecovery(false);
    await clearProcessedRecoveryUrl();
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        pendingPasswordRecovery,
        setPendingPasswordRecovery,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
