import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAnon, supabaseAdmin } from '../lib/supabase';
import { handleResendConfirmation } from '../services/authService';
// Remove the unused import

interface AuthLog {
  email: string;
  status: 'attempt'|'success'|'failed';
  details?: Record<string, unknown>;
  user_agent?: string;
  email_confirmed?: boolean;
  error_type?: string;
  attempt_count?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  handleAuthCallback: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Crée un client authentifié avec le token JWT
const getAuthClient = async (accessToken: string) => {
  return createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  );
};

const logAuthAttempt = async (
  email: string,
  status: AuthLog['status'],
  details: AuthLog['details'] = {},
  errorType?: string,
  emailConfirmed?: boolean
) => {
  try {
    // Fonction pour parser le JWT
    const parseJwt = (token: string) => {
      try {
        return JSON.parse(atob(token.split('.')[1]));
      } catch (e) {
        console.error('Failed to parse JWT:', e);
        return null;
      }
    };

    console.log('Tentative d\'insertion dans auth_logs:', { email, status });
    
    // Récupération de la session avec debug
    const { data: { session }, error: sessionError } = await supabaseAnon.auth.getSession();
    console.log('Session info:', {
      hasSession: !!session,
      error: sessionError,
      accessToken: session?.access_token,
      user: session?.user,
      jwtClaims: session?.access_token ? parseJwt(session.access_token) : null
    });

    // Utiliser le client authentifié si l'utilisateur est connecté
    let client = session
      ? await getAuthClient(session.access_token)
      : supabaseAnon;

    console.log('Using client:', client === supabaseAnon ? 'anon' : 'authenticated');

    // Premier essai avec le client normal
    let { data, error } = await client
      .from('auth_logs')
      .insert({
        email,
        status,
        details,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        ip_address: null,
        email_confirmed: emailConfirmed,
        error_type: errorType,
        attempt_count: 1
      })
      .select();

    // Si échec dû à RLS et que le client admin est configuré
    if (error?.code === '42501' && import.meta.env.VITE_SUPABASE_SERVICE_KEY) {
      console.warn('RLS failed - retrying with admin client', {
        hasServiceKey: !!import.meta.env.VITE_SUPABASE_SERVICE_KEY,
        adminClient: !!supabaseAdmin
      });
      client = supabaseAdmin;
    } else if (error?.code === '42501') {
      console.error('RLS failed but no admin client configured - check VITE_SUPABASE_SERVICE_KEY');
      ({ data, error } = await client
        .from('auth_logs')
        .insert({
          email,
          status,
          details,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          ip_address: null,
          email_confirmed: emailConfirmed,
          error_type: errorType,
          attempt_count: 1
        })
        .select());
    }

    if (error) {
      // Force admin client if RLS violation occurs
      if (error.code === '42501') {
        console.warn('RLS violation - retrying with admin client');
        const { error: adminError } = await supabaseAdmin
          .from('auth_logs')
          .insert({
            email,
            status,
            details,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            ip_address: null,
            email_confirmed: emailConfirmed,
            error_type: errorType,
            attempt_count: 1
          });
        
        if (adminError) {
          console.error('Admin client also failed:', adminError);
          return false;
        }
        return true;
      }

      console.error('SQL Error:', error);
      return false;
    }

    console.log('Insertion réussie:', data);

    return true;
  } catch (error) {
    console.warn('Failed to log auth attempt - falling back to console:', error);
    console.log('Auth attempt:', { email, status, details, errorType });
    return false;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signIn = async (email: string, password: string) => {
    console.log('[DEBUG] Début de signIn');
    const normalizedEmail = email.toLowerCase().trim();
    const trimmedPassword = password.trim();

    console.log('[DEBUG] Vérification rate limiting');
    try {
      const session = (await supabaseAnon.auth.getSession()).data.session;
      const client = session ? await getAuthClient(session.access_token) : supabaseAnon;
      const { count, error: countError } = await client
        .from('auth_logs')
        .select('*', { count: 'exact', head: true })
        .eq('email', normalizedEmail)
        .eq('status', 'failed')
        .gte('timestamp', new Date(Date.now() - 3600000).toISOString());

      if (countError) {
        console.error('[DEBUG] Erreur rate limiting check:', countError);
      }

      if (count && count >= 5) {
        console.log('[DEBUG] Rate limited déclenché');
        toast.error('Trop de tentatives échouées. Veuillez réessayer plus tard.');
        throw new Error('rate_limited');
      }
    } catch (err) {
      console.error('[DEBUG] Exception rate limiting:', err);
    }

    console.log('[DEBUG] Appel logAuthAttempt');
    const logResult = await logAuthAttempt(normalizedEmail, 'attempt');
    console.log('[DEBUG] Résultat logAuthAttempt:', logResult);
    
    try {
      const { data, error } = await supabaseAnon.auth.signInWithPassword({
        email: normalizedEmail,
        password: trimmedPassword,
      });

      if (error) {
        await logAuthAttempt(
          normalizedEmail,
          'failed',
          { error: error.message },
          error.message.includes('Email not confirmed')
            ? 'email_not_confirmed'
            : 'invalid_credentials',
          false
        );
        
        if (error.message.includes('Email not confirmed')) {
          const { data: { user } } = await supabaseAnon.auth.getUser();
          
          if (user?.confirmed_at || user?.email_confirmed_at) {
            const err = new Error('invalid_credentials');
            await logAuthAttempt(
              normalizedEmail,
              'failed',
              { error: 'Invalid credentials (email confirmed)' },
              'invalid_credentials',
              true
            );
            toast.error('Email ou mot de passe incorrect');
            throw err;
          } else {
            await logAuthAttempt(
              normalizedEmail,
              'failed',
              { error: 'Email not confirmed' },
              'email_not_confirmed',
              false
            );
            
            // Message d'erreur amélioré avec instructions détaillées
            toast.error(
              <div className="space-y-2">
                <p className="font-medium">Veuillez confirmer votre email</p>
                <p className="text-sm">Un email de confirmation a été envoyé à <span className="font-medium">{user?.email}</span></p>
                <ol className="text-xs list-decimal pl-4">
                  <li>Vérifiez votre boîte de réception et vos dossiers spam</li>
                  <li>Cliquez sur le lien "Confirmer mon email"</li>
                  <li>Revenez sur cette page pour vous connecter</li>
                </ol>
              </div>,
              {
                duration: 8000, // Durée plus longue pour lire les instructions
                action: {
                  label: 'Renvoyer',
                  onClick: () => handleResendConfirmation(normalizedEmail)
                }
              }
            );
            throw new Error('email_not_confirmed');
          }
        } else if (error.message.includes('Invalid login credentials')) {
          const err = new Error('invalid_credentials');
          const logged = await logAuthAttempt(
            normalizedEmail,
            'failed',
            { error: 'Invalid credentials', details: error },
            'invalid_credentials',
            false
          );
          console.log('Auth log attempt result:', logged);
          toast.error('Email ou mot de passe incorrect');
          throw err;
        } else if (error.message.includes('rate_limited')) {
          await logAuthAttempt(
            normalizedEmail,
            'failed',
            { error: 'Rate limited' },
            'rate_limited',
            false
          );
          throw error;
        } else {
          await logAuthAttempt(
            normalizedEmail,
            'failed',
            { error: error.message },
            'unknown_error',
            false
          );
          toast.error(`Erreur technique lors de la connexion`);
          throw error;
        }
      }

      await logAuthAttempt(normalizedEmail, 'success');
      
      if (!data.user) {
        toast.error('Aucune donnée utilisateur reçue');
        throw new Error('No user data returned');
      }

      document.cookie = `sb-access-token=${data.session?.access_token}; Secure; SameSite=Lax; Path=/; Domain=${window.location.hostname}`;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabaseAnon.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    // Implémentation de signOut
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabaseAnon.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return true;
  };

  const handleAuthCallback = async () => {
    // Implémentation de handleAuthCallback
  };

  useEffect(() => {
    supabaseAnon.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabaseAnon.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        handleAuthCallback,
        resendConfirmation: handleResendConfirmation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
