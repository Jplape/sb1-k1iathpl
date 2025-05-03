import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

const reportSchema = z.object({
  reason: z.string().min(10, 'Please provide a detailed reason'),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportModalProps {
  contentType: 'product' | 'message' | 'user';
  contentId: string;
  reportedId: string;
  onClose: () => void;
}

export function ReportModal({
  contentType,
  contentId,
  reportedId,
  onClose,
}: ReportModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
  });

  const onSubmit = async (data: ReportFormData) => {
    try {
      const { error } = await supabase.from('reports').insert({
        content_type: contentType,
        content_id: contentId,
        reported_id: reportedId,
        reason: data.reason,
      });

      if (error) throw error;

      toast.success('Report submitted successfully');
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center space-x-2 text-yellow-600 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Report Content</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reason for reporting
            </label>
            <textarea
              {...register('reason')}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Please explain why you're reporting this content..."
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}