import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Line,
  Bar,
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  Eye,
  MessageSquare,
  TrendingUp,
  Zap,
  AlertTriangle,
  Loader2,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Filter,
  Search,
  Sparkles,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type ListingStatus = 'active' | 'paused' | 'expired';

export function Dashboard() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<ListingStatus>('active');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch listings
  const { data: listings = [], isLoading: loadingListings } = useQuery({
    queryKey: ['listings', user?.id, statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('seller_id', user?.id);

      if (statusFilter !== 'expired') {
        query = query.eq('status', statusFilter);
      } else {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.lt('created_at', thirtyDaysAgo.toISOString());
      }

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!user,
  });

  // Fetch KPIs
  const { data: kpis, isLoading: loadingKPIs } = useQuery({
    queryKey: ['seller-kpis', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_seller_stats', {
        seller_id: user?.id,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isLoading = loadingListings || loadingKPIs;

  // Chart data
  const days = Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(), i), 'd MMM', { locale: fr })
  ).reverse();

  const viewsData = {
    labels: days,
    datasets: [
      {
        label: 'Vues',
        data: kpis?.daily_views || Array(7).fill(0),
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Action handlers
  const handleStatusChange = async (productId: string, newStatus: ListingStatus) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', productId);

      if (error) throw error;
      toast.success('Statut mis à jour avec succès');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleBoostListing = async (productId: string, option: 'spotlight' | 'urgent') => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          [option === 'spotlight' ? 'featured' : 'urgent']: true,
        })
        .eq('id', productId);

      if (error) throw error;
      toast.success('Option activée avec succès');
    } catch (error) {
      console.error('Error boosting listing:', error);
      toast.error('Erreur lors de l\'activation de l\'option');
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
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord vendeur</h1>
          <p className="text-sm text-gray-500">
            Gérez vos annonces et suivez vos performances
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Vues totales</p>
            <Eye className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold">{kpis?.total_views || 0}</p>
          <p className="text-sm text-emerald-600">
            +{kpis?.views_growth || 0}% cette semaine
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Messages reçus</p>
            <MessageSquare className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold">{kpis?.total_messages || 0}</p>
          <p className="text-sm text-emerald-600">
            +{kpis?.messages_growth || 0}% cette semaine
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Taux de conversion</p>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold">{kpis?.conversion_rate || 0}%</p>
          <p className="text-sm text-emerald-600">
            +{kpis?.conversion_growth || 0}% ce mois
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Options actives</p>
            <Zap className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold">{kpis?.active_options || 0}</p>
          <p className="text-sm text-gray-500">En cours</p>
        </div>
      </div>

      {/* Graphique des vues */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Évolution des vues (7 jours)</h3>
        <Line data={viewsData} options={chartOptions} />
      </div>

      {/* Gestion des annonces */}
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ListingStatus)}
                className="rounded-lg border-gray-300 dark:border-gray-600"
              >
                <option value="active">Actives</option>
                <option value="paused">En pause</option>
                <option value="expired">Expirées</option>
              </select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une annonce..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-lg border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>

            <Button onClick={() => window.location.href = '/create-ad'}>
              Nouvelle annonce
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Annonce
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Messages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Options
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <h4 className="font-medium">{listing.title}</h4>
                        <p className="text-sm text-gray-500">{listing.price}€</p>
                        {listing.description_ai && (
                          <div className="flex items-center gap-1 text-brand text-xs mt-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Description IA</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span>{listing.views || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <span>{listing.message_count || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {listing.featured && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Zap className="w-3 h-3 mr-1" />
                          En vedette
                        </span>
                      )}
                      {listing.urgent && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Urgent
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {listing.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(listing.id, 'paused')}
                        >
                          <PauseCircle className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(listing.id, 'active')}
                        >
                          <PlayCircle className="w-4 h-4" />
                        </Button>
                      )}

                      {!listing.featured && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBoostListing(listing.id, 'spotlight')}
                        >
                          <Zap className="w-4 h-4" />
                        </Button>
                      )}

                      {!listing.urgent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBoostListing(listing.id, 'urgent')}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </Button>
                      )}

                      {listing.status === 'expired' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(listing.id, 'active')}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}