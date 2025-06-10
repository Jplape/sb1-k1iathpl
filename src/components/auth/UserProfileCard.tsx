import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ResendConfirmationButton } from './ResendConfirmationButton';

export const UserProfileCard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [emailConfirmed, setEmailConfirmed] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkEmailConfirmation = async () => {
      if (!user) return;
      
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Erreur lors de la vérification du statut de l\'email:', error);
        return;
      }
      
      setEmailConfirmed(
        !!data.user?.email_confirmed_at || 
        !!data.user?.confirmed_at
      );
    };
    
    checkEmailConfirmation();
  }, [user]);
  
  if (!user) {
    return <div>Vous n'êtes pas connecté</div>;
  }
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center">
        <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xl font-bold">
          {user.email?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="ml-4">
          <h2 className="text-xl font-semibold">{user.email}</h2>
          <div className="flex items-center mt-1">
            <span 
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                emailConfirmed 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}
              title={
                emailConfirmed 
                  ? 'Votre email a été confirmé' 
                  : 'Veuillez confirmer votre email pour accéder à toutes les fonctionnalités'
              }
            >
              {emailConfirmed ? 'Email confirmé' : 'Email non confirmé'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 border-t border-gray-200 pt-4">
        <h3 className="text-lg font-medium">Statut du compte</h3>
        <div className="mt-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              {emailConfirmed ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  Vérifié
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <svg className="mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3" />
                  </svg>
                  Non vérifié
                </span>
              )}
            </div>
          </div>
          
          {!emailConfirmed && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-700 mb-2">
                Votre email n'a pas encore été confirmé. Certaines fonctionnalités peuvent être limitées.
              </p>
              <ResendConfirmationButton 
                email={user.email || ''} 
                variant="primary" 
                className="w-full"
              />
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Dernière connexion</p>
              <p className="text-sm">{new Date(user.last_sign_in_at || '').toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 border-t border-gray-200 pt-4">
        <button
          onClick={() => signOut()}
          className="w-full bg-red-50 text-red-700 py-2 px-4 rounded-md hover:bg-red-100 transition-colors"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
};


