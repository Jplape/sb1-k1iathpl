import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface PhotoUploadStepProps {
  isUploading: boolean;
  setIsUploading: (value: boolean) => void;
}

export function PhotoUploadStep({
  isUploading,
  setIsUploading,
}: PhotoUploadStepProps) {
  const { user } = useAuth();
  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  const images = watch('images');
  const isPremium = watch('premium.extraPhotos');
  const maxPhotos = isPremium ? 10 : 3;

  const onDrop = async (acceptedFiles: File[]) => {
    if (!user) {
      toast.error('Veuillez vous connecter pour télécharger des photos');
      return;
    }

    if (images.length + acceptedFiles.length > maxPhotos) {
      toast.error(`Vous ne pouvez pas télécharger plus de ${maxPhotos} photos`);
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setValue('images', [...images, ...uploadedUrls]);
      toast.success('Photos téléchargées avec succès');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors du téléchargement des photos');
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    disabled: isUploading || images.length >= maxPhotos,
  });

  const removeImage = (index: number) => {
    setValue(
      'images',
      images.filter((_: string, i: number) => i !== index)
    );
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragActive
            ? 'border-brand bg-brand/5'
            : 'border-gray-300 dark:border-gray-600'
        } ${
          isUploading || images.length >= maxPhotos
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:border-brand hover:bg-brand/5'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="flex justify-center">
            {isUploading ? (
              <Loader2 className="w-12 h-12 text-brand animate-spin" />
            ) : (
              <ImagePlus className="w-12 h-12 text-gray-400" />
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">
              {isDragActive
                ? 'Déposez vos photos ici'
                : 'Glissez-déposez vos photos ici ou cliquez pour sélectionner'}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {isPremium
                ? 'Jusqu\'à 10 photos (compte premium)'
                : 'Jusqu\'à 3 photos'}
            </p>
          </div>
        </div>
      </div>

      {errors.images && (
        <p className="text-sm text-rose-500">
          {errors.images.message as string}
        </p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((url: string, index: number) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}