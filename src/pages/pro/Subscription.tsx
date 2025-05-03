import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const plans = [
  {
    id: 'pro-monthly',
    name: 'Pro Mensuel',
    price: 29.99,
    interval: 'mois',
    features: [
      'Publications illimitées',
      'Statistiques avancées',
      'Support prioritaire',
      'Badge vendeur Pro',
      'Visibilité accrue',
      '0% de commission',
    ],
  },
  {
    id: 'pro-yearly',
    name: 'Pro Annuel',
    price: 299.99,
    interval: 'an',
    features: [
      'Tous les avantages du plan mensuel',
      '2 mois gratuits',
      'Formation exclusive',
      'API dédiée',
      'Manager de compte',
      'Garantie satisfait ou remboursé',
    ],
    popular: true,
  },
];

export function Subscription() {
  const { user } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleSubscribe = async (planId: string) => {
    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      // Rediriger vers la page de paiement Stripe
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Erreur lors de la création de l\'abonnement');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Passez au niveau supérieur</h1>
        <p className="text-gray-500 mt-2">
          Choisissez le plan qui correspond à vos besoins et développez votre activité
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white dark:bg-gray-800 rounded-xl p-8 ${
              plan.popular
                ? 'ring-2 ring-brand relative'
                : 'border border-gray-200 dark:border-gray-700'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-8 transform -translate-y-1/2">
                <div className="bg-brand text-white text-sm font-medium px-3 py-1 rounded-full">
                  Populaire
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-4xl font-bold">{plan.price}€</span>
                  <span className="text-gray-500">/{plan.interval}</span>
                </div>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan.id)}
                className="w-full"
                disabled={subscription?.status === 'active'}
              >
                {subscription?.status === 'active'
                  ? 'Déjà abonné'
                  : `Choisir ${plan.name}`}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>
          Les prix sont en euros et incluent la TVA.
          Vous pouvez annuler votre abonnement à tout moment.
        </p>
      </div>
    </div>
  );
}