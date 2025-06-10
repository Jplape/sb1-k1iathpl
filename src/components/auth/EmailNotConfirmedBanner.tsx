import React, { useState, useEffect } from 'react';
import { ResendConfirmationButton } from './ResendConfirmationButton';

interface EmailNotConfirmedBannerProps {
  email: string;
  className?: string;
  onClose?: () => void;
}

export const EmailNotConfirmedBanner: React.FC<EmailNotConfirmedBannerProps> = ({
  email,
  className = '',
  onClose
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Vérifier si la bannière a été fermée précédemment
  useEffect(() => {
    const dismissedUntil = localStorage.getItem('emailBannerDismissedUntil');
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      setIsDismissed(true);
    }
  }, []);
  
  const handleDismiss = () => {
    // Fermer pour 24 heures
    const dismissUntil = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem('emailBannerDismissedUntil', dismissUntil.toString());
    setIsDismissed(true);
    if (onClose) onClose();
  };
  
  if (isDismissed) return null;
  
  return (
    <div className={`p-4 rounded-md bg-amber-50 border border-amber-200 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-amber-800">Confirmation d'email requise</h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>
              Votre adresse email <span className="font-medium">{email}</span> n'a pas encore été confirmée.
              Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation.
            </p>
            <div className="mt-3 space-y-2">
              <p className="text-xs">
                <span className="font-medium">Conseils :</span>
                <ul className="list-disc pl-5 mt-1">
                  <li>Vérifiez également vos dossiers spam/indésirables</li>
                  <li>L'email a été envoyé depuis no-reply@supabase.co</li>
                  <li>Le lien de confirmation est valide pendant 24 heures</li>
                </ul>
              </p>
              <div className="flex items-center">
                <p className="text-xs mr-2">Vous n'avez pas reçu l'email ou le lien a expiré?</p>
                <ResendConfirmationButton 
                  email={email} 
                  variant="secondary" 
                  className="text-xs py-1 px-2"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={handleDismiss}
            className="inline-flex rounded-md bg-amber-50 text-amber-500 hover:bg-amber-100 focus:outline-none"
          >
            <span className="sr-only">Fermer</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};