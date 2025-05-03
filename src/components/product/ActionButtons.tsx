import React from 'react';
import { Heart, Share2, ShoppingCart, MessageSquare, Zap } from 'lucide-react';
import { Button } from '../ui/Button';

interface ActionButtonsProps {
  isOwner: boolean;
  onBuy: () => void;
  onContact: () => void;
  onManageOptions: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
}

export function ActionButtons({
  isOwner,
  onBuy,
  onContact,
  onManageOptions,
  onFavorite,
  onShare,
}: ActionButtonsProps) {
  return (
    <div className="flex gap-4 sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t md:border-none md:p-0 md:static">
      {isOwner ? (
        <Button onClick={onManageOptions} className="flex-1">
          <Zap className="w-5 h-5 mr-2" />
          Gérer les options
        </Button>
      ) : (
        <>
          <Button onClick={onBuy} className="flex-1">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Acheter
          </Button>
          <Button onClick={onContact} variant="outline" className="flex-1">
            <MessageSquare className="w-5 h-5 mr-2" />
            Contacter
          </Button>
        </>
      )}
      <Button variant="outline" onClick={onFavorite}>
        <Heart className="w-5 h-5" />
      </Button>
      <Button variant="outline" onClick={onShare}>
        <Share2 className="w-5 h-5" />
      </Button>
    </div>
  );
}