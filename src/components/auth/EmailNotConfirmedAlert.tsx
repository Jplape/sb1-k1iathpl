import React from 'react';
import { ResendConfirmationButton } from './ResendConfirmationButton';

interface EmailNotConfirmedAlertProps {
  email: string;
  className?: string;
  variant?: 'inline' | 'box' | 'toast';
  onClose?: () => void;
}

export const EmailNotConfirmedAlert: React.FC<EmailNotConfirmedAlertProps> = ({
  email,
  className = '',
  variant = 'box',
  onClose
}) => {
  const getContainerStyles = () => {
    switch (variant) {
      case 'inline':
        return 'text-amber-700 text-sm flex items-center gap-2';
      case 'box':
        return 'p-4 rounded-md bg-amber-50 border border-amber-200';
      case 'toast':
        return 'p-3 rounded-md bg-white shadow-md border-l-4 border-l-amber-500';
      default:
        return 'p-4 rounded-md bg-amber-50 border border-amber-200';
    }
  };

  return (
    <div className={`${getContainerStyles()} ${className}`}>
      {variant === 'box' && (
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-amber-800">Email non confirmé</h3>
            <div className="mt-2 text-sm text-amber-700">
              <p>
                Votre adresse email <span className="font-medium">{email}</span> n'a pas été confirmée.
                Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation.
              </p>
              <div className="mt-3">
                <p className="text-xs mb-1">Vous n'avez pas reçu l'email ou le lien a expiré?</p>
                <ResendConfirmationButton 
                  email={email} 
                  variant="secondary" 
                  className="text-xs py-1 px-2"
                />
              </div>
            </div>
          </div>
          {onClose && (
            <div className="ml-auto pl-3">
              <button
                onClick={onClose}
                className="inline-flex rounded-md bg-amber-50 text-amber-500 hover:bg-amber-100 focus:outline-none"
              >
                <span className="sr-only">Fermer</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {variant === 'inline' && (
        <>
          <svg className="h-4 w-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Email non confirmé. <ResendConfirmationButton email={email} variant="text" className="text-xs" /></span>
        </>
      )}

      {variant === 'toast' && (
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">Email non confirmé</p>
            <p className="mt-1 text-sm text-gray-500">
              Veuillez confirmer votre adresse email {email}.
            </p>
            <div className="mt-2">
              <ResendConfirmationButton 
                email={email} 
                variant="text" 
                className="text-xs"
              />
            </div>
          </div>
          {onClose && (
            <div className="ml-auto pl-3">
              <button
                onClick={onClose}
                className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">Fermer</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};