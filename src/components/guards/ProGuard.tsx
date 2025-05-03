import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ProGuardProps {
  children: React.ReactNode;
}

export function ProGuard({ children }: ProGuardProps) {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    async function checkProStatus() {
      if (!user) {
        setIsPro(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_pro')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setIsPro(data.is_pro);
      } catch (error) {
        console.error('Error checking pro status:', error);
        setIsPro(false);
      }
    }

    checkProStatus();
  }, [user]);

  if (isPro === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isPro) {
    return <Navigate to="/pro/subscription" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}