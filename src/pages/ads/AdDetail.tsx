import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAd } from '../../hooks/useAd';
import { PhotoGallery } from '../../components/product/PhotoGallery';
import { AdHeader } from '../../components/product/AdHeader';
import { AdDescription } from '../../components/product/AdDescription';
import { ActionButtons } from '../../components/product/ActionButtons';
import { ManageOptionsModal } from '../../components/product/ManageOptionsModal';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function AdDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showLightbox, setShowLightbox] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const { data: product, isLoading, error } = useAd(id!);

  // Pre-fetch the first image after product data is loaded
  if (!isLoading && product?.images?.[0] && typeof document !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = product.images[0];
    document.head.appendChild(link);
  }

  const isOwner = user?.id === product?.seller_id;
  const maxPhotos = product?.premium_photos ? 10 : 3;
  const visiblePhotos = product?.images?.slice(0, maxPhotos) || [];

  const handleBuyNow = () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour acheter');
      return;
    }
    navigate(`/checkout/${id}`);
  };

  const handleContactSeller = async () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour contacter le vendeur');
      return;
    }

    if (!product) return;

    try {
      const { data, error } = await supabase
        .rpc('create_conversation', {
          p_product_id: product.id,
          p_seller_id: product.seller_id
        });

      if (error) throw error;
      navigate(`/messages/${data}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Erreur lors de la création de la conversation');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Produit non trouvé</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* SEO Metadata */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.title,
          "description": product.description,
          "image": product.images,
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "EUR",
            "availability": product.status === 'active' ? "InStock" : "OutOfStock"
          },
          ...(product.rating && {
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": product.rating,
              "reviewCount": product.review_count || 0
            }
          })
        })}
      </script>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Photo Gallery */}
        <PhotoGallery
          photos={visiblePhotos}
          title={product.title}
          isUrgent={product.urgent}
          isSpotlight={product.featured}
          onPhotoClick={(index) => {
            setCurrentImageIndex(index);
            setShowLightbox(true);
          }}
        />

        {/* Product Info */}
        <div className="space-y-6">
          <AdHeader
            title={product.title}
            price={product.price}
            rating={product.rating}
            reviewCount={product.review_count}
          />

          <AdDescription
            description={product.description}
            descriptionAI={product.description_ai}
          />

          <ActionButtons
            isOwner={isOwner}
            onBuy={handleBuyNow}
            onContact={handleContactSeller}
            onManageOptions={() => setShowOptionsModal(true)}
            onFavorite={() => {}}
            onShare={() => {}}
          />
        </div>
      </div>

      {/* Options Modal */}
      {showOptionsModal && (
        <ManageOptionsModal
          onClose={() => setShowOptionsModal(false)}
          onConfirm={async (options) => {
            try {
              const { error } = await supabase
                .from('products')
                .update({
                  featured: options.spotlight,
                  urgent: options.urgent,
                  premium_photos: options.premiumPhotos,
                })
                .eq('id', product.id);

              if (error) throw error;
              toast.success('Options mises à jour avec succès');
              setShowOptionsModal(false);
            } catch (error) {
              console.error('Error updating options:', error);
              toast.error('Erreur lors de la mise à jour des options');
            }
          }}
          currentOptions={{
            spotlight: product.featured || false,
            urgent: product.urgent || false,
            premiumPhotos: product.premium_photos || false,
          }}
        />
      )}
    </div>
  );
}