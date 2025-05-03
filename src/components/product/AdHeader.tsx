import React from 'react';
import { Star } from 'lucide-react';

interface AdHeaderProps {
  title: string;
  price: number;
  rating?: number;
  reviewCount?: number;
}

export function AdHeader({ title, price, rating, reviewCount }: AdHeaderProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" itemProp="name">
        {title}
      </h1>

      {typeof rating !== 'undefined' && (
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            ({reviewCount || 0} avis)
          </span>
        </div>
      )}

      <p className="text-4xl font-bold text-brand" itemProp="offers" itemScope itemType="https://schema.org/Offer">
        <span itemProp="price">{price}</span>
        <meta itemProp="priceCurrency" content="EUR" />€
      </p>
    </div>
  );
}