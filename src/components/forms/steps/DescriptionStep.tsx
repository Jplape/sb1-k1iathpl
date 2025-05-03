import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../ui/Button';

interface DescriptionStepProps {
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
}

export function DescriptionStep({
  isGenerating,
  setIsGenerating,
}: DescriptionStepProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const title = watch('title');
  const category = watch('category');

  const generateDescription = async () => {
    if (!title || !category) {
      toast.error('Le titre et la catégorie sont requis pour générer une description');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/chatbot/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          category,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate description');

      const data = await response.json();
      setValue('description', data.description);
      toast.success('Description générée avec succès');
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error('Erreur lors de la génération de la description');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Description</label>
        <Button
          type="button"
          variant="outline"
          onClick={generateDescription}
          disabled={isGenerating || !title || !category}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Générer une description
            </>
          )}
        </Button>
      </div>

      <textarea
        {...register('description')}
        rows={8}
        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand focus:border-brand dark:border-gray-600 dark:bg-gray-800"
        placeholder="Décrivez votre article en détail..."
      />

      {errors.description && (
        <p className="text-sm text-rose-500">
          {errors.description.message as string}
        </p>
      )}

      <div className="text-sm text-gray-500">
        <h4 className="font-medium mb-2">Conseils pour une bonne description :</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>Mentionnez l'état du produit</li>
          <li>Indiquez les caractéristiques importantes</li>
          <li>Précisez les défauts éventuels</li>
          <li>Ajoutez les dimensions si pertinent</li>
          <li>Évitez les abréviations</li>
        </ul>
      </div>
    </div>
  );
}