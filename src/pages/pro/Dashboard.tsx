import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Line, Bar } from 'react-chartjs-2';
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
  TrendingUp,
  Users,
  ShoppingBag,
  Clock,
  Star,
  AlertTriangle,
  Loader2,
  Upload,
  CreditCard,
} from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// Enregistrer les composants Chart.js
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

export function ProDashboard() {
  const { user } = useAuth();

  // Charger le profil utilisateur
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Charger les statistiques de vente
  const { data: salesStats, isLoading: loadingSales } = useQuery({
    queryKey: ['sales-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_seller_stats', { seller_id: user?.id });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Charger les statistiques par catégorie
  const { data: categoryStats, isLoading: loadingCategories } = useQuery({
    queryKey: ['category-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_sales_by_category', { seller_id: user?.id });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isLoading = loadingProfile || loadingSales || loadingCategories;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Générer les labels pour les 6 derniers mois
  const months = Array.from({ length: 6 }, (_, i) => 
    format(subMonths(new Date(), i), 'MMM', { locale: fr })
  ).reverse();

  // Options communes pour les graphiques
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

  // Données pour le graphique d'évolution des ventes
  const salesData = {
    labels: months,
    datasets: [
      {
        label: 'Chiffre d\'affaires (€)',
        data: salesStats?.monthly_revenue || Array(6).fill(0),
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Nombre de ventes',
        data: salesStats?.monthly_sales || Array(6).fill(0),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // Données pour le graphique de répartition par catégorie
  const categoryData = {
    labels: categoryStats?.map(stat => stat.category_name) || [],
    datasets: [
      {
        label: 'Ventes par catégorie',
        data: categoryStats?.map(stat => stat.total_sales) || [],
        backgroundColor: [
          'rgba(37, 99, 235, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
      },
    ],
  };

  // KPIs calculés
  const kpis = {
    revenue: {
      monthly: salesStats?.current_month_revenue || 0,
      trend: salesStats?.revenue_trend || 0,
    },
    conversion: {
      rate: salesStats?.conversion_rate || 0,
      trend: salesStats?.conversion_trend || 0,
    },
    sales: {
      count: salesStats?.total_sales || 0,
      trend: salesStats?.sales_trend || 0,
    },
    rating: {
      average: salesStats?.average_rating || 0,
      trend: salesStats?.rating_trend || 0,
    },
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord Pro</h1>
          <p className="text-sm text-gray-500">
            Gérez votre activité et suivez vos performances
          </p>
        </div>
        <div className="flex gap-4">
          {profile?.kyc_status !== 'verified' && (
            <Button className="gap-2" onClick={() => window.location.href = '/pro/kyc'}>
              <Upload className="w-4 h-4" />
              Vérifier mon compte
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">CA Mensuel</p>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold">{kpis.revenue.monthly}€</p>
          <p className={`text-sm font-medium ${kpis.revenue.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {kpis.revenue.trend > 0 ? '+' : ''}{kpis.revenue.trend}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Taux conversion</p>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold">{kpis.conversion.rate}%</p>
          <p className={`text-sm font-medium ${kpis.conversion.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {kpis.conversion.trend > 0 ? '+' : ''}{kpis.conversion.trend}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Ventes</p>
            <ShoppingBag className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold">{kpis.sales.count}</p>
          <p className={`text-sm font-medium ${kpis.sales.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {kpis.sales.trend > 0 ? '+' : ''}{kpis.sales.trend}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Note moyenne</p>
            <Star className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-semibold">{kpis.rating.average}/5</p>
          <p className={`text-sm font-medium ${kpis.rating.trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {kpis.rating.trend > 0 ? '+' : ''}{kpis.rating.trend}
          </p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Évolution des ventes</h3>
          <Line data={salesData} options={chartOptions} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Répartition par catégorie</h3>
          <Bar data={categoryData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}