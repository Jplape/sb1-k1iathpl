import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

const authSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type AuthFormData = z.infer<typeof authSchema>;

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const getRecaptchaToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const recaptcha = (window as any).grecaptcha?.enterprise;
    if (!recaptcha) {
      reject(new Error('reCAPTCHA not initialized'));
      return;
    }

    recaptcha.ready(() => {
      recaptcha
        .execute('6Ld6nCgrAAAAAINVgazQXKeWVh30-RrTOvOEbSQx', { action: 'LOGIN' })
        .then(resolve)
        .catch(reject);
    });
  });
};

export function AuthModal({ onClose }: { onClose: () => void }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    mode: 'onChange',
  });

  const verifyRecaptcha = async (retryCount = 0): Promise<string | null> => {
    try {
      const token = await getRecaptchaToken();
      
      if (!token) {
        throw new Error('Failed to get reCAPTCHA token');
      }

      const verifyResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-recaptcha`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ token }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Verification failed');
      }

      const result = await verifyResponse.json();
      return result.success ? token : null;

    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return verifyRecaptcha(retryCount + 1);
      }
      
      return null;
    }
  };

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    try {
      const token = await verifyRecaptcha();
      if (!token) {
        toast.error('La vérification de sécurité a échoué. Veuillez actualiser la page et réessayer.');
        return;
      }

      if (isSignUp) {
        await signUp(data.email, data.password);
        toast.success('Compte créé avec succès !');
      } else {
        await signIn(data.email, data.password);
        toast.success('Connexion réussie !');
        onClose();
      }
    } catch (error) {
      console.error('Auth error:', error);
      
      if (error instanceof Error) {
        switch (error.message) {
          case 'email_not_confirmed':
            toast.error('Veuillez confirmer votre adresse email avant de vous connecter', {
              duration: 6000,
              description: 'Un email de confirmation vous a été envoyé lors de votre inscription.'
            });
            break;
          case 'invalid_credentials':
            toast.error('Email ou mot de passe incorrect');
            break;
          case 'email_in_use':
            toast.error('Cet email est déjà utilisé');
            break;
          default:
            toast.error('Une erreur est survenue. Veuillez réessayer.');
        }
      } else {
        toast.error('Une erreur inattendue est survenue');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{isSignUp ? 'Créer un compte' : 'Se connecter'}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              {...register('email')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              {...register('password')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isSignUp ? 'Création du compte...' : 'Connexion...'}
              </>
            ) : (
              isSignUp ? 'Créer un compte' : 'Se connecter'
            )}
          </Button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-4 text-sm text-blue-600 hover:text-blue-500"
          disabled={isLoading}
        >
          {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire'}
        </button>
      </div>
    </div>
  );
}