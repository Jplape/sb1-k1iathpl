import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search as SearchIcon,
  Filter,
  SlidersHorizontal,
  MapPin,
  Zap,
  AlertTriangle,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  condition: string;
  location: string;
  urgent: boolean;
  spotlight: boolean;
  created_at: string;
}

type SortOption = 'date_desc' | 'date_asc' | 'price_asc' | 'price_desc' | 'relevance';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Pertinence' },
  { value: 'date_desc', label: 'Plus récent' },
  { value: 'date_asc', label: 'Plus ancien' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
];

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Filters state
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [priceMin, setPriceMin] = useState(searchParams.get('priceMin') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('priceMax') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [urgent, setUrgent] = useState(searchParams.get('urgent') === 'true');
  const [spotlight, setSpotlight] = useState(searchParams.get('spotlight') === 'true');
  const [sort, setSort] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'relevance');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug')
          .order('name');

        if (error) throw error;
        setCategories(data || []);

        // If we have a category slug in the URL, find and set the corresponding ID
        if (category && !category.includes('-')) {
          const categoryData = data?.find(cat => cat.slug === category);
          if (categoryData) {
            setCategory(categoryData.id);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [category]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('products')
          .select('*')
          .eq('status', 'active');

        // Apply filters
        if (category) query = query.eq('category_id', category);
        if (priceMin) query = query.gte('price', parseFloat(priceMin));
        if (priceMax) query = query.lte('price', parseFloat(priceMax));
        if (location) query = query.ilike('location', `%${location}%`);
        if (urgent) query = query.eq('urgent', true);
        if (spotlight) query = query.eq('spotlight', true);
        if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);

        // Apply sorting
        switch (sort) {
          case 'date_desc':
            query = query.order('created_at', { ascending: false });
            break;
          case 'date_asc':
            query = query.order('created_at', { ascending: true });
            break;
          case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }

        // Pagination
        query = query.range((page - 1) * 24, page * 24 - 1);

        const { data, error } = await query;

        if (error) throw error;
        
        setProducts(prev => page === 1 ? data : [...prev, ...data]);
        setHasMore(data.length === 24);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(debounce);
  }, [category, priceMin, priceMax, location, urgent, spotlight, sort, searchQuery, page]);

  const updateFilters = () => {
    const params = new URLSearchParams();
    if (category) {
      // Store the slug in the URL instead of the ID for better UX
      const categoryData = categories.find(cat => cat.id === category);
      if (categoryData) {
        params.set('category', categoryData.slug);
      }
    }
    if (priceMin) params.set('priceMin', priceMin);
    if (priceMax) params.set('priceMax', priceMax);
    if (location) params.set('location', location);
    if (urgent) params.set('urgent', 'true');
    if (spotlight) params.set('spotlight', 'true');
    if (sort !== 'relevance') params.set('sort', sort);
    if (searchQuery) params.set('q', searchQuery);
    setSearchParams(params);
    setPage(1);
  };

  const resetFilters = () => {
    setCategory('');
    setPriceMin('');
    setPriceMax('');
    setLocation('');
    setUrgent(false);
    setSpotlight(false);
    setSort('relevance');
    setSearchParams({});
    setPage(1);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Filters Sidebar */}
      <aside className="w-80 flex-shrink-0 p-6 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Catégorie</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                updateFilters();
              }}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Prix</label>
            <div className="flex gap-4">
              <input
                type="number"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => {
                  setPriceMin(e.target.value);
                  updateFilters();
                }}
                className="w-1/2 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800"
              />
              <input
                type="number"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => {
                  setPriceMax(e.target.value);
                  updateFilters();
                }}
                className="w-1/2 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Localisation</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Ville, région..."
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  updateFilters();
                }}
                className="w-full pl-10 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={urgent}
                onChange={(e) => {
                  setUrgent(e.target.checked);
                  updateFilters();
                }}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm">Urgent uniquement</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={spotlight}
                onChange={(e) => {
                  setSpotlight(e.target.checked);
                  updateFilters();
                }}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm">Annonces en vedette</span>
            </label>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={resetFilters}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Search Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  updateFilters();
                }}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800"
              />
            </div>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortOption);
                updateFilters();
              }}
              className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-6" onScroll={handleScroll}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <article
                key={product.id}
                className={cn(
                  "bg-white dark:bg-gray-800 rounded-xl overflow-hidden transition-shadow hover:shadow-md",
                  product.spotlight && "ring-2 ring-yellow-400"
                )}
                aria-label={product.title}
              >
                <div className="relative aspect-square">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {product.urgent && (
                    <div
                      className="absolute top-2 right-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded"
                      role="status"
                      aria-label="Urgent"
                    >
                      URGENT
                    </div>
                  )}
                  {product.spotlight && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      En vedette
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-medium mb-1 line-clamp-1">{product.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">{product.price}€</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {product.location}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune annonce trouvée</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Essayez de modifier vos filtres de recherche
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}