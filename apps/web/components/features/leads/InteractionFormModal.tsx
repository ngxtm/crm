'use client';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { interactionLogSchema, InteractionLogFormData } from '@/lib/validations/lead.schema';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui/form';
import { PhoneCall, X } from 'lucide-react';
import { toast } from 'sonner';

interface InteractionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
  leadName?: string;
}

const interactionTypes = [
  { value: 'call', label: 'Cuộc gọi' },
  { value: 'message', label: 'Tin nhắn' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Họp' },
  { value: 'note', label: 'Ghi chú' },
];

export function InteractionFormModal({
  isOpen, onClose, onSubmit, leadName
}: InteractionFormModalProps) {
  const methods = useForm<InteractionLogFormData>({
    resolver: zodResolver(interactionLogSchema),
    defaultValues: {
      type: 'call',
      content: '',
      summary: '',
      duration_seconds: undefined,
    },
  });

  const handleSubmit = async (data: InteractionLogFormData) => {
    const success = await onSubmit(data);
    if (success) {
      toast.success('Đã thêm tương tác thành công!');
      methods.reset();
      onClose();
    } else {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
    }
  };

  const watchType = methods.watch('type');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <PhoneCall className="text-purple-600" />
            Thêm tương tác cho Lead: {leadName}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X size={20} />
          </button>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
            <FormSelect
              name="type"
              label="Loại tương tác"
              required
              options={interactionTypes}
            />

            <FormInput
              name="summary"
              label="Tóm tắt"
              placeholder="Tóm tắt ngắn gọn"
            />

            <FormTextarea
              name="content"
              label="Nội dung chi tiết"
              placeholder="Ghi chú chi tiết về cuộc tương tác..."
              rows={4}
              required
            />

            {watchType === 'call' && (
              <FormInput
                name="duration_seconds"
                label="Thời lượng (giây)"
                type="number"
                placeholder="Nhập thời lượng cuộc gọi"
              />
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={methods.formState.isSubmitting}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {methods.formState.isSubmitting ? 'Đang xử lý...' : 'Thêm tương tác'}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
