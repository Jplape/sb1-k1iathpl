import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Heart,
  Loader2,
  TrendingDown,
  TrendingUp,
  Bell,
  BellOff,
  Trash2,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type WatchlistItem = {
  id: string;
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
    status: string;
  };
  original_price: number;
  notify_price_drop: boolean;
  notify_back_in_stock: boolean;
  created_at: string;
};

type SortField = 'date' | 'price' | 'change';
type SortOrder = 'asc' | 'desc';

export function Watchlist() {
  const { user } = useAuth();
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('watchlist')
        .select(`
          id,
          original_price,
          notify_price_drop,
          notify_back_in_stock,
          created_at,
          product:products (
            id,
            title,
            price,
            images,
            status
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      return data as WatchlistItem[];
    },
    enabled: !!user,
  });

  const sortedItems = [...items].sort((a, b) => {
    switch (sortField) {
      case 'date':
        return sortOrder === 'desc'
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'price':
        return sortOrder === 'desc'
          ? b.product.price - a.product.price
          : a.product.price - b.product.price;
      case 'change':
        const changeA = ((a.product.price - a.original_price) / a.original_price) * 100;
        const changeB = ((b.product.price - b.original_price) / b.original_price) * 100;
        return sortOrder === 'desc' ? changeB - changeA : changeA - changeB;
      default:
        return 0;
    }
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleNotification = async (
    itemId: string,
    type: 'price_drop' | 'back_in_stock'
  ) => {
    try {
      const { error } = await supabase
        .from('watchlist')
        .update({
          [type === 'price_drop' ? 'notify_price_drop' : 'notify_back_in_stock']:
            type === 'price_drop'
              ? !items.find(item => item.id === itemId)?.notify_price_drop
              : !items.find(item => item.id === itemId)?.notify_back_in_stock,
        })
        .eq('id', itemId);

      if (error) throw error;
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast.error('Failed to update notification preferences');
    }
  };

  const removeFromWatchlist = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      toast.success('Removed from watchlist');
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast.error('Failed to remove from watchlist');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Watchlist</h1>
          <p className="text-gray-500 mt-1">
            {items.length} {items.length === 1 ? 'item' : 'items'} watched
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <Heart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No items in watchlist</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start adding items to your watchlist to track prices and get notifications.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('price')}
                  >
                    <div className="flex items-center gap-2">
                      Price
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('change')}
                  >
                    <div className="flex items-center gap-2">
                      Price Change
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center gap-2">
                      Added
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notifications
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedItems.map((item) => {
                  const priceChange = ((item.product.price - item.original_price) / item.original_price) * 100;
                  const isLowerPrice = item.product.price < item.original_price;

                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.title}
                            className="h-16 w-16 object-cover rounded"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.product.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              Original price: {item.original_price}€
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.product.price}€
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center text-sm font-medium ${
                          isLowerPrice ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {isLowerPrice ? (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          )}
                          {Math.abs(priceChange).toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(item.created_at), 'PP', { locale: fr })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleNotification(item.id, 'price_drop')}
                            title={item.notify_price_drop ? 'Disable price drop notifications' : 'Enable price drop notifications'}
                          >
                            {item.notify_price_drop ? (
                              <Bell className="h-4 w-4 text-brand" />
                            ) : (
                              <BellOff className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleNotification(item.id, 'back_in_stock')}
                            title={item.notify_back_in_stock ? 'Disable back in stock notifications' : 'Enable back in stock notifications'}
                          >
                            {item.notify_back_in_stock ? (
                              <Bell className="h-4 w-4 text-brand" />
                            ) : (
                              <BellOff className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromWatchlist(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}