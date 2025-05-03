import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Zap, ImagePlus, AlertTriangle } from 'lucide-react';

const premiumOptions = [
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

export function PremiumOptionsStep() {
  const { register, watch } = useFormContext();
  const selectedOptions = watch('premium');

  const totalPrice = Object.entries(selectedOptions).reduce(
    (total, [key, value]) => {
      if (value) {
        const option = premiumOptions.find((opt) => opt.id === key);
        return total + (option?.price || 0);
      }
      return total;
    },
    0
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {premiumOptions.map((option) => (
          <label
            key={option.id}
            className="relative flex items-start p-4 cursor-pointer rounded-xl border border-gray-200 hover:border-brand transition-colors dark:border-gray-700"
          >
            <input
              type="checkbox"
              {...register(`premium.${option.id}`)}
              className="sr-only"
            />
            <div className="flex items-center h-5">
              <div
                className={`w-4 h-4 border rounded transition-colors ${
                  selectedOptions[option.id]
                    ? 'bg-brand border-brand'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <svg
                  className={`w-4 h-4 text-white ${
                    selectedOptions[option.id] ? 'block' : 'hidden'
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

      {totalPrice > 0 && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="font-medium">Total</span>
            <span className="font-bold text-lg text-brand">
              {totalPrice.toFixed(2)}€
            </span>
          </div>
        </div>
      )}
    </div>
  );
}