import React, { useState } from 'react';
import { handleResendConfirmation } from '../../services/authService';

interface ResendConfirmationButtonProps {
  email: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'text';
}

export const ResendConfirmationButton: React.FC<ResendConfirmationButtonProps> = ({
  email,
  className = '',
  variant = 'primary'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSent, setLastSent] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);

  // Vérifier si un email a été envoyé récemment (moins de 60 secondes)
  React.useEffect(() => {
    if (!lastSent) return;
    
    const cooldownPeriod = 60; // 60 secondes
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastSent) / 1000);
      const remaining = cooldownPeriod - elapsed;
      
      if (remaining <= 0) {
        setRemainingTime(0);
        setLastSent(null);
        clearInterval(interval);
      } else {
        setRemainingTime(remaining);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lastSent]);

  const handleClick = async () => {
    if (isLoading || remainingTime > 0) return;
    
    setIsLoading(true);
    try {
      await handleResendConfirmation(email);
      setLastSent(Date.now());
      setRemainingTime(60);
    } finally {
      setIsLoading(false);
    }
  };

  // Styles selon le variant
  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md';
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md';
      case 'text':
        return 'text-blue-600 hover:text-blue-500 underline';
      default:
        return 'text-blue-600 hover:text-blue-500 underline';
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || remainingTime > 0}
      className={`${getButtonStyles()} ${isLoading || remainingTime > 0 ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {isLoading ? (
        'Envoi en cours...'
      ) : remainingTime > 0 ? (
        `Réessayer dans ${remainingTime}s`
      ) : (
        'Renvoyer l\'email de confirmation'
      )}
    </button>
  );
};