import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';

export function useAd(adId: string) {
  return useQuery({
    queryKey: ['ad', adId],
    queryFn: async () => {
      // Fetch product with seller profile
      const { data: product, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles:seller_id (
            full_name,
            role
          )
        `)
        .eq('id', adId)
        .single();

      if (error) throw error;

      // Fetch reviews stats if they exist
      const { data: reviewStats } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', adId);

      // Calculate rating and review count
      const rating = reviewStats?.length
        ? reviewStats.reduce((acc, review) => acc + review.rating, 0) / reviewStats.length
        : undefined;

      return {
        ...product,
        rating,
        review_count: reviewStats?.length,
      } as Product;
    },
    staleTime: 60_000, // 1 min
  });
}