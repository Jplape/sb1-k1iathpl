import React from 'react';
import { useFormContext } from 'react-hook-form';
import { MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

export function BasicInfoStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          Titre de l'annonce
        </label>
        <input
          type="text"
          {...register('title')}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand dark:border-gray-600 dark:bg-gray-800"
          placeholder="Ex: iPhone 12 Pro Max - 256Go"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-rose-500">
            {errors.title.message as string}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Prix</label>
        <div className="relative">
          <input
            type="number"
            step="0.01"
            {...register('price', { valueAsNumber: true })}
            className="w-full pl-4 pr-8 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand dark:border-gray-600 dark:bg-gray-800"
            placeholder="0.00"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            €
          </span>
        </div>
        {errors.price && (
          <p className="mt-1 text-sm text-rose-500">
            {errors.price.message as string}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Catégorie</label>
        <select
          {...register('category')}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="">Sélectionnez une catégorie</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-rose-500">
            {errors.category.message as string}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Localisation</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            {...register('location')}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand dark:border-gray-600 dark:bg-gray-800"
            placeholder="Ville, région..."
          />
        </div>
        {errors.location && (
          <p className="mt-1 text-sm text-rose-500">
            {errors.location.message as string}
          </p>
        )}
      </div>
    </div>
  );
}