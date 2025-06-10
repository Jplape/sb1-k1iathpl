import React from 'react';
import { Bell, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

export function Profile() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {user ? `Bonjour ${user.email?.split('@')[0]} !` : 'Profil'}
        </h1>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg p-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-gray-200" />
            <div>
              <h2 className="text-lg font-semibold">
                {user ? user.email : 'Invité'}
              </h2>
              <p className="text-sm text-gray-500">
                {user ? 'Compte Professionnel' : 'Veuillez vous connecter'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Button variant="outline" className="justify-start">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            <Button variant="outline" className="justify-start">
              <CreditCard className="h-4 w-4 mr-2" />
              Facturation
            </Button>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Mes annonces</h3>
            <div className="text-center text-gray-500 py-8">
              Aucune annonce pour le moment
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}