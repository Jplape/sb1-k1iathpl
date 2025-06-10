import { CountrySelect } from '../../components/ui/CountrySelect';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const kycSchema = z.object({
  firstName: z.string().min(2, 'Le prénom est requis'),
  lastName: z.string().min(2, 'Le nom est requis'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance invalide'),
  address: z.string().min(5, 'L\'adresse est requise'),
  city: z.string().min(2, 'La ville est requise'),
  postalCode: z.string().regex(/^\d{5}$/, 'Code postal invalide'),
  country: z.string().min(2, 'Le pays est requis'),
});

type KYCFormData = z.infer<typeof kycSchema>;

export function KYC() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [idCardUrl, setIdCardUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KYCFormData>({
    resolver: zodResolver(kycSchema),
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (!user) return;

      setUploading(true);
      try {
        const file = acceptedFiles[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/kyc-id-card.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('kyc-documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('kyc-documents')
          .getPublicUrl(fileName);

        setIdCardUrl(publicUrl);
        toast.success('Document téléchargé avec succès');
      } catch (error) {
        console.error('Error uploading document:', error);
        toast.error('Erreur lors du téléchargement du document');
      } finally {
        setUploading(false);
      }
    },
  });

  const onSubmit = async (data: KYCFormData) => {
    if (!user || !idCardUrl) {
      toast.error('Veuillez télécharger votre pièce d\'identité');
      return;
    }

    setVerifying(true);
    try {
      const { error } = await supabase.from('kyc_requests').insert({
        user_id: user.id,
        status: 'pending',
        document_url: idCardUrl,
        ...data,
      });

      if (error) throw error;

      toast.success(
        'Votre demande de vérification a été envoyée. Nous la traiterons dans les plus brefs délais.',
        { duration: 6000 }
      );
    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Vérification d'identité</h1>
        <p className="text-gray-500 mt-2">
          Pour garantir la sécurité de notre plateforme, nous devons vérifier votre identité.
          Cette procédure est obligatoire pour accéder aux fonctionnalités Pro.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Prénom</label>
              <input
                type="text"
                {...register('firstName')}
                className="w-full rounded-lg border-gray-300"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input
                type="text"
                {...register('lastName')}
                className="w-full rounded-lg border-gray-300"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date de naissance</label>
            <input
              type="date"
              {...register('birthDate')}
              className="w-full rounded-lg border-gray-300"
            />
            {errors.birthDate && (
              <p className="mt-1 text-sm text-red-600">{errors.birthDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Adresse</label>
            <input
              type="text"
              {...register('address')}
              className="w-full rounded-lg border-gray-300"
              autoComplete="address-line1"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ville</label>
              <input
                type="text"
                {...register('city')}
                className="w-full rounded-lg border-gray-300"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Code postal</label>
              <input
                type="text"
                {...register('postalCode')}
                className="w-full rounded-lg border-gray-300"
                autoComplete="postal-code"
              />
              {errors.postalCode && (
                <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Pays</label>
            <CountrySelect
              {...register('country')}
              defaultValue="GA"
            />
            {errors.country && (
              <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Pièce d'identité
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragActive
                  ? 'border-brand bg-brand/5'
                  : 'border-gray-300 hover:border-brand hover:bg-brand/5'
              }`}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-brand" />
              ) : idCardUrl ? (
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Document téléchargé</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Glissez-déposez votre pièce d'identité ici, ou cliquez pour sélectionner
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Vos documents d'identité sont traités de manière sécurisée et confidentielle.
                  Ils ne seront utilisés que pour la vérification de votre compte.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!idCardUrl || verifying}
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Vérification en cours...
              </>
            ) : (
              'Envoyer ma demande'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}