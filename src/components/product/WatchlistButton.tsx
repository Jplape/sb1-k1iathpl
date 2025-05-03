import React from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface WatchlistButtonProps {
  productId: string;
  price: number;
  className?: string;
}

export function WatchlistButton({ productId, price, className = '' }: WatchlistButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isWatched, isLoading } = useQuery({
    queryKey: ['watchlist', productId],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('watchlist')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!user,
  });

  const { mutate: toggleWatch, isLoading: isToggling } = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');

      if (isWatched) {
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('product_id', productId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('watchlist')
          .insert({
            product_id: productId,
            user_id: user.id,
            original_price: price,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast.success(
        isWatched
          ? 'Removed from watchlist'
          : 'Added to watchlist'
      );
    },
    onError: (error) => {
      console.error('Error toggling watchlist:', error);
      toast.error('Failed to update watchlist');
    },
  });

  if (!user) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => toggleWatch()}
      disabled={isLoading || isToggling}
      className={className}
      title={isWatched ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <Heart
        className={`h-4 w-4 ${isWatched ? 'fill-red-500 text-red-500' : ''}`}
      />
    </Button>
  );
}