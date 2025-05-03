import React from 'react';
import { MapPin, Star } from 'lucide-react';

interface PreviewStepProps {
  data: {
    title: string;
    price: number;
    category: string;
    location: string;
    images: string[];
    description: string;
    premium: {
      spotlight: boolean;
      urgent: boolean;
      extraPhotos: boolean;
    };
  };
}

export function PreviewStep({ data }: PreviewStepProps) {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
        {/* Image Gallery */}
        <div className="aspect-video relative">
          {data.images[0] ? (
            <img
              src={data.images[0]}
              alt={data.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-400">Aucune image</span>
            </div>
          )}
          {data.premium.urgent && (
            <div className="absolute top-4 right-4 bg-rose-500 text-white text-sm font-medium px-3 py-1 rounded-full">
              URGENT
            </div>
          )}
          {data.premium.spotlight && (
            <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-sm font-medium px-3 py-1 rounded-full">
              En vedette
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">{data.title}</h2>
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl font-bold text-brand">
              {data.price}€
            </span>
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="w-4 h-4 mr-1" />
              {data.location}
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
            {data.description}
          </p>
        </div>
      </div>

      <div className="bg-brand/5 border border-brand/10 rounded-xl p-6">
        <h3 className="font-medium mb-4">Options sélectionnées :</h3>
        <ul className="space-y-2">
          {data.premium.spotlight && (
            <li className="flex items-center text-sm">
              <Star className="w-4 h-4 mr-2 text-brand" />
              Annonce mise en avant
            </li>
          )}
          {data.premium.urgent && (
            <li className="flex items-center text-sm">
              <Star className="w-4 h-4 mr-2 text-brand" />
              Tag "URGENT" ajouté
            </li>
          )}
          {data.premium.extraPhotos && (
            <li className="flex items-center text-sm">
              <Star className="w-4 h-4 mr-2 text-brand" />
              Photos supplémentaires activées
            </li>
          )}
          {!data.premium.spotlight &&
            !data.premium.urgent &&
            !data.premium.extraPhotos && (
            <li className="text-sm text-gray-500">
              Aucune option premium sélectionnée
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}