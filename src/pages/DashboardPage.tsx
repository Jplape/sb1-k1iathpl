import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { EmailNotConfirmedBanner } from '../components/auth/EmailNotConfirmedBanner';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
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
  
  return (
    <div className="container mx-auto px-4 py-8">
      {user && emailConfirmed === false && (
        <EmailNotConfirmedBanner 
          email={user.email || ''} 
          className="mb-6"
        />
      )}
      
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
      
      {/* Contenu existant du dashboard */}
    </div>
  );
};