import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, AlertTriangle, ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { useAd } from '../hooks/useAd';
import { supabase } from '../lib/supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const optionsSchema = z.object({
  spotlight: z.boolean(),
  urgent: z.boolean(),
  extraPhotos: z.boolean(),
});

type OptionsFormData = z.infer<typeof optionsSchema>;

const options = [
  {
    id: 'spotlight',
    title: 'Mettre en avant',
    description: 'Votre annonce apparaîtra en haut des résultats de recherche',
    price: 4.99,
    icon: Zap,
  },
  {
    id: 'urgent',
    title: 'Tag Urgent',
    description: 'Ajoutez un badge "URGENT" pour plus de visibilité',
    price: 2.99,
    icon: AlertTriangle,
  },
  {
    id: 'extraPhotos',
    title: 'Photos supplémentaires',
    description: 'Ajoutez jusqu\'à 10 photos (au lieu de 3)',
    price: 1.99,
    icon: ImagePlus,
  },
];

export function AdOptions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const { data: ad, isLoading } = useAd(id!);

  const { register, watch, handleSubmit } = useForm<OptionsFormData>({
    resolver: zodResolver(optionsSchema),
    defaultValues: {
      spotlight: false,
      urgent: false,
      extraPhotos: false,
    },
  });

  const selectedOptions = watch();

  const calculateTotal = () => {
    return options.reduce((total, option) => {
      if (selectedOptions[option.id as keyof OptionsFormData]) {
        return total + option.price;
      }
      return total;
    }, 0);
  };

  const handlePayment = async (data: OptionsFormData) => {
    if (!ad) return;

    setProcessing(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adId: ad.id,
          options: data,
          price: calculateTotal(),
        }),
      });

      const session = await response.json();

      if (session.error) {
        throw new Error(session.error);
      }

      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Une erreur est survenue lors du paiement');
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Annonce non trouvée</h2>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Options de mise en avant</h1>
        <p className="text-gray-500 mt-2">
          Augmentez la visibilité de votre annonce avec nos options premium
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <img
            src={ad.images[0]}
            alt={ad.title}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div>
            <h2 className="font-medium">{ad.title}</h2>
            <p className="text-gray-500">{ad.price}€</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(handlePayment)} className="space-y-6">
          <div className="space-y-4">
            {options.map((option) => (
              <label
                key={option.id}
                className="relative flex items-start p-4 cursor-pointer rounded-xl border border-gray-200 hover:border-brand transition-colors"
              >
                <input
                  type="checkbox"
                  {...register(option.id as keyof OptionsFormData)}
                  className="sr-only"
                />
                <div className="flex items-center h-5">
                  <div
                    className={`w-4 h-4 border rounded transition-colors ${
                      selectedOptions[option.id as keyof OptionsFormData]
                        ? 'bg-brand border-brand'
                        : 'border-gray-300'
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 text-white ${
                        selectedOptions[option.id as keyof OptionsFormData] ? 'block' : 'hidden'
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <option.icon className="w-5 h-5 text-brand mr-2" />
                      <span className="font-medium">{option.title}</span>
                    </div>
                    <span className="text-sm font-medium text-brand">
                      {option.price.toFixed(2)}€
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {option.description}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {calculateTotal() > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total</span>
                <span className="font-bold text-lg text-brand">
                  {calculateTotal().toFixed(2)}€
                </span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={calculateTotal() === 0 || processing}
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              'Payer et activer les options'
            )}
          </Button>
        </form>
      </div>

      <div className="text-sm text-gray-500 text-center">
        <p>
          Les paiements sont sécurisés par Stripe.
          Vous pouvez annuler vos options à tout moment.
        </p>
      </div>
    </div>
  );
}