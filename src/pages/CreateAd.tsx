import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { BasicInfoStep } from '../components/forms/steps/BasicInfoStep';
import { PhotoUploadStep } from '../components/forms/steps/PhotoUploadStep';
import { DescriptionStep } from '../components/forms/steps/DescriptionStep';
import { PremiumOptionsStep } from '../components/forms/steps/PremiumOptionsStep';
import { PreviewStep } from '../components/forms/steps/PreviewStep';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const createAdSchema = z.object({
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères'),
  price: z.number().min(0, 'Le prix doit être positif'),
  category: z.string().min(1, 'La catégorie est requise'),
  location: z.string().min(1, 'La localisation est requise'),
  description: z.string().min(10, 'La description doit faire au moins 10 caractères'),
  images: z.array(z.string()).min(1, 'Au moins une photo est requise'),
  premium: z.object({
    spotlight: z.boolean(),
    urgent: z.boolean(),
    extraPhotos: z.boolean(),
  }),
});

type FormData = z.infer<typeof createAdSchema>;

const steps = [
  { id: 'basic', title: 'Informations de base' },
  { id: 'photos', title: 'Photos' },
  { id: 'description', title: 'Description' },
  { id: 'premium', title: 'Options premium' },
  { id: 'preview', title: 'Aperçu' },
];

export function CreateAd() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const methods = useForm<FormData>({
    resolver: zodResolver(createAdSchema),
    defaultValues: {
      images: [],
      premium: {
        spotlight: false,
        urgent: false,
        extraPhotos: false,
      },
    },
  });

  const { handleSubmit, trigger, watch } = methods;
  const formData = watch();

  const handleNext = async () => {
    const isValid = await trigger(getFieldsForStep(currentStep));
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const getFieldsForStep = (step: number): Array<keyof FormData> => {
    switch (step) {
      case 0:
        return ['title', 'price', 'category', 'location'];
      case 1:
        return ['images'];
      case 2:
        return ['description'];
      case 3:
        return ['premium'];
      default:
        return [];
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast.error('Veuillez vous connecter pour créer une annonce');
      return;
    }

    try {
      const { error } = await supabase.from('products').insert({
        title: data.title,
        description: data.description,
        price: data.price,
        category_id: data.category,
        location: data.location,
        images: data.images,
        seller_id: user.id,
        featured: data.premium.spotlight,
        urgent: data.premium.urgent,
        premium_photos: data.premium.extraPhotos,
        status: 'active',
      });

      if (error) throw error;

      toast.success('Annonce créée avec succès');
      navigate('/profile');
    } catch (error) {
      console.error('Error creating ad:', error);
      toast.error("Une erreur s'est produite lors de la création de l'annonce");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep />;
      case 1:
        return (
          <PhotoUploadStep
            isUploading={isUploading}
            setIsUploading={setIsUploading}
          />
        );
      case 2:
        return (
          <DescriptionStep
            isGenerating={isGeneratingDescription}
            setIsGenerating={setIsGeneratingDescription}
          />
        );
      case 3:
        return <PremiumOptionsStep />;
      case 4:
        return <PreviewStep data={formData} />;
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 ${
                  index < steps.length - 1 ? 'relative' : ''
                }`}
              >
                <div
                  className={`h-2 ${
                    index <= currentStep
                      ? 'bg-brand'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
                <div className="mt-2 text-sm text-center">{step.title}</div>
                {index < steps.length - 1 && (
                  <div
                    className={`absolute top-0 right-0 w-4 h-4 -mr-2 rounded-full border-2 border-white dark:border-gray-900 ${
                      index <= currentStep
                        ? 'bg-brand'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Steps */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isUploading || isGeneratingDescription}
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Créer l'annonce
              </Button>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  );
}