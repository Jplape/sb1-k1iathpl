import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { handleAuthCallback } = useAuth();

  useEffect(() => {
    const processAuth = async () => {
      try {
        await handleAuthCallback();
        navigate('/');
      } catch (error) {
        console.error('Error processing auth callback:', error);
        navigate('/');
      }
    };

    processAuth();
  }, [handleAuthCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-lg text-gray-600">Processing authentication...</p>
      </div>
    </div>
  );
};