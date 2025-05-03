import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, PlusCircle, Laptop, Car, Home as HomeIcon, Shirt, Repeat, FolderRoot as Football, Briefcase, Wrench, Heart, MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: React.ReactNode;
}

const categories: Category[] = [
  { id: '1', name: 'Électronique', slug: 'electronics', icon: <Laptop className="w-6 h-6" /> },
  { id: '2', name: 'Véhicules', slug: 'vehicles', icon: <Car className="w-6 h-6" /> },
  { id: '3', name: 'Immobilier', slug: 'real-estate', icon: <HomeIcon className="w-6 h-6" /> },
  { id: '4', name: 'Mode', slug: 'fashion', icon: <Shirt className="w-6 h-6" /> },
  { id: '5', name: 'Troc', slug: 'barter', icon: <Repeat className="w-6 h-6" /> },
  { id: '6', name: 'Sport & Loisirs', slug: 'sports', icon: <Football className="w-6 h-6" /> },
  { id: '7', name: 'Emploi', slug: 'jobs', icon: <Briefcase className="w-6 h-6" /> },
  { id: '8', name: 'Services', slug: 'services', icon: <Wrench className="w-6 h-6" /> },
];

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  location: string;
  featured: boolean;
}

export function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [spotlightProducts, setSpotlightProducts] = useState<Product[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [popularCategories, setPopularCategories] = useState<Category[]>(() => {
    const stored = localStorage.getItem('popularCategories');
    return stored ? JSON.parse(stored) : categories.slice(0, 8);
  });
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSpotlightProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('featured', true)
          .limit(5);

        if (error) throw error;
        setSpotlightProducts(data || []);
      } catch (error) {
        console.error('Error fetching spotlight products:', error);
      }
    };

    fetchSpotlightProducts();
  }, []);

  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select('title')
          .ilike('title', `%${searchQuery}%`)
          .limit(5);

        if (error) throw error;
        setSuggestions(data?.map(item => item.title) || []);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };

    const debounce = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => 
      prev === spotlightProducts.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => 
      prev === 0 ? spotlightProducts.length - 1 : prev - 1
    );
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section with Search */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-brand to-blue-700 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative max-w-3xl mx-auto text-center space-y-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            Trouvez exactement ce que vous cherchez
          </h1>
          <p className="text-lg text-blue-100">
            Des milliers d'annonces vérifiées à portée de main
          </p>
          <div ref={searchRef} className="relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Que recherchez-vous ?"
                className="w-full h-14 pl-12 pr-4 rounded-xl text-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </form>
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 divide-y divide-gray-100">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setSuggestions([]);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Spotlight Carousel */}
      <section className="relative">
        <h2 className="text-2xl font-bold mb-6">Annonces en vedette</h2>
        <div className="relative overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {spotlightProducts.map((product) => (
              <div
                key={product.id}
                className="w-full flex-shrink-0"
              >
                <Link
                  to={`/product/${product.id}`}
                  className="relative block aspect-[16/9] overflow-hidden rounded-xl"
                >
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">{product.title}</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-xl font-semibold">{product.price}€</span>
                      <span className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        {product.location}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {spotlightProducts.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  currentSlide === index
                    ? "bg-white w-6"
                    : "bg-white/60 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Catégories populaires</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {popularCategories.map((category) => (
            <Link
              key={category.id}
              to={`/search?category=${category.slug}`}
              className="group relative overflow-hidden rounded-xl bg-white hover:shadow-md transition-all p-6 border border-gray-200"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-gray-100 group-hover:bg-brand/10 transition-colors">
                  {category.icon}
                </div>
                <span className="font-medium">{category.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <Link
        to="/create-ad"
        className="fixed bottom-6 right-6 bg-brand text-white rounded-full shadow-lg p-4 hover:bg-brand/90 transition-colors"
      >
        <PlusCircle className="w-6 h-6" />
      </Link>
    </div>
  );
}