import toast from 'react-hot-toast';

const RESEND_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/resend`;

export const resendConfirmationEmail = async (
  email: string,
  retries = 3
): Promise<{ success: boolean; error?: string }> => {
  console.log(`Tentative d'envoi d'email à ${email}`);
  
  if (!email.includes('@')) {
    return { success: false, error: 'Format email invalide' };
  }

  // Fallback pour le mode développement
  if (import.meta.env.MODE === 'development') {
    console.log('Mode développement - Email simulé');
    return { success: true };
  }

  // Utiliser l'Edge Function Supabase au lieu de l'endpoint direct
  // pour une meilleure sécurité et flexibilité
  const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resend-confirmation`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Tentative ${attempt}/${retries}`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email }),
      });

      if (response.status === 429) {
        const errorMsg = 'Trop de tentatives. Veuillez réessayer plus tard.';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      if (!response.ok) {
        const errorMsg = `Erreur HTTP ${response.status}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      const data = await response.json();
      console.log('Réponse du serveur:', data);
      
      if (data.success) {
        console.log('Email envoyé avec succès');
        return { success: true };
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (error) {
      if (attempt === retries) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Erreur inconnue' 
        };
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  return { success: false, error: 'Nombre maximum de tentatives atteint' };
};

export const handleResendConfirmation = async (email: string) => {
  const toastId = toast.loading('Envoi en cours...');
  const { success, error } = await resendConfirmationEmail(email);
  
  toast.dismiss(toastId);
  if (success) {
    toast.success('Email envoyé! Vérifiez votre boîte de réception.', {
      duration: 5000
    });
    // Ajouter un tracking pour les emails renvoyés
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ 
          event: 'confirmation_email_resent',
          email 
        }),
      });
    } catch (err) {
      console.error('Erreur de tracking:', err);
    }
  } else {
    toast.error(`Échec de l'envoi: ${error}`, {
      duration: 8000
    });
  }
};
