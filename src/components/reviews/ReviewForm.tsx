import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, 'Le commentaire doit faire au moins 10 caractères'),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const { user } = useAuth();
  const [hoveredRating, setHoveredRating] = React.useState(0);
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
    },
  });

  const rating = watch('rating');

  const onSubmit = async (data: ReviewFormData) => {
    if (!user) {
      toast.error('Vous devez être connecté pour laisser un avis');
      return;
    }

    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: productId,
        user_id: user.id,
        rating: data.rating,
        comment: data.comment,
      });

      if (error) throw error;

      toast.success('Merci pour votre avis !');
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error("Une erreur s'est produite lors de l'envoi de votre avis");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Note
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className="text-2xl focus:outline-none"
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setValue('rating', value)}
            >
              <Star
                className={`h-6 w-6 ${
                  value <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        {errors.rating && (
          <p className="mt-1 text-sm text-red-600">Veuillez donner une note</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Commentaire
        </label>
        <textarea
          {...register('comment')}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Partagez votre expérience..."
        />
        {errors.comment && (
          <p className="mt-1 text-sm text-red-600">{errors.comment.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
      </Button>
    </form>
  );
}