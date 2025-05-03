import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '../ui/Button';

interface ManageOptionsModalProps {
  onClose: () => void;
  onConfirm: (options: {
    spotlight: boolean;
    urgent: boolean;
    premiumPhotos: boolean;
  }) => Promise<void>;
  currentOptions: {
    spotlight: boolean;
    urgent: boolean;
    premiumPhotos: boolean;
  };
}

export function ManageOptionsModal({
  onClose,
  onConfirm,
  currentOptions,
}: ManageOptionsModalProps) {
  const [spotlight, setSpotlight] = useState(currentOptions.spotlight);
  const [urgent, setUrgent] = useState(currentOptions.urgent);
  const [premiumPhotos, setPremiumPhotos] = useState(currentOptions.premiumPhotos);
  const [loading, setLoading] = useState(false);

  const calculateTotal = () => {
    let total = 0;
    if (spotlight && !currentOptions.spotlight) total += 4.99;
    if (urgent && !currentOptions.urgent) total += 2.99;
    if (premiumPhotos && !currentOptions.premiumPhotos) total += 1.99;
    return total;
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm({ spotlight, urgent, premiumPhotos });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Gérer les options</h3>
        
        <div className="space-y-4">
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={spotlight}
              onChange={(e) => setSpotlight(e.target.checked)}
              className="mt-1"
            />
            <div>
              <p className="font-medium">Mettre en avant (4.99€)</p>
              <p className="text-sm text-gray-500">
                Votre annonce apparaîtra en haut des résultats
              </p>
            </div>
          </label>

          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
              className="mt-1"
            />
            <div>
              <p className="font-medium">Tag Urgent (2.99€)</p>
              <p className="text-sm text-gray-500">
                Ajoutez un badge "URGENT" pour plus de visibilité
              </p>
            </div>
          </label>

          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={premiumPhotos}
              onChange={(e) => setPremiumPhotos(e.target.checked)}
              className="mt-1"
            />
            <div>
              <p className="font-medium">Photos supplémentaires (1.99€)</p>
              <p className="text-sm text-gray-500">
                Ajoutez jusqu'à 10 photos (au lieu de 3)
              </p>
            </div>
          </label>
        </div>

        {calculateTotal() > 0 && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total à payer</span>
              <span className="text-lg font-bold text-brand">
                {calculateTotal().toFixed(2)}€
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Mise à jour...' : 'Confirmer'}
          </Button>
        </div>
      </div>
    </div>
  );
}