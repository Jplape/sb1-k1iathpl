import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Star } from 'lucide-react';
import type { Review } from '../../types';

interface ReviewListProps {
  reviews: Review[];
  className?: string;
}

export function ReviewList({ reviews, className = '' }: ReviewListProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {reviews.map((review) => (
        <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div>
                <p className="font-medium">{review.user?.full_name || 'Utilisateur'}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(review.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
            </div>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-gray-700">{review.comment}</p>
        </div>
      ))}
    </div>
  );
}