'use client';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productGroupSchema, ProductGroupFormData } from '@/lib/validations/product-group.schema';
import { FormInput, FormTextarea } from '@/components/ui/form';
import { PlusCircle, Edit, X } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface ProductGroupFormModalProps {
  mode: 'add' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
  defaultValues?: any;
}

export function ProductGroupFormModal({
  mode, isOpen, onClose, onSubmit, defaultValues
}: ProductGroupFormModalProps) {
  const methods = useForm<ProductGroupFormData>({
    resolver: zodResolver(productGroupSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (defaultValues && mode === 'edit') {
      methods.reset({
        name: defaultValues.name || '',
        code: defaultValues.code || '',
        description: defaultValues.description || '',
        is_active: defaultValues.is_active ?? true,
      });
    } else if (mode === 'add') {
      methods.reset({
        name: '',
        code: '',
        description: '',
        is_active: true,
      });
    }
  }, [defaultValues, mode, methods]);

  const handleSubmit = async (data: ProductGroupFormData) => {
    const success = await onSubmit(data);
    if (success) {
      toast.success(mode === 'add' ? 'Đã thêm nhóm sản phẩm thành công!' : 'Đã cập nhật nhóm sản phẩm thành công!');
      methods.reset();
      onClose();
    } else {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            {mode === 'add' ? (
              <><PlusCircle className="text-accent" /> Thêm nhóm sản phẩm mới</>
            ) : (
              <><Edit className="text-accent" /> Chỉnh sửa nhóm sản phẩm</>
            )}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X size={20} />
          </button>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
            <FormInput
              name="name"
              label="Tên nhóm"
              placeholder="VD: Hộp giấy"
              required
            />

            <FormInput
              name="code"
              label="Mã nhóm"
              placeholder="BOX"
              required
            />

            <FormTextarea
              name="description"
              label="Mô tả"
              placeholder="Mô tả về nhóm sản phẩm này"
              rows={3}
            />

            {mode === 'edit' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is-active"
                  className="w-4 h-4 text-accent border-slate-300 rounded focus:ring-accent"
                  {...methods.register('is_active')}
                />
                <label htmlFor="is-active" className="text-sm text-slate-700">
                  Nhóm đang hoạt động
                </label>
              </div>
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
                className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {methods.formState.isSubmitting ? 'Đang xử lý...' : (mode === 'add' ? 'Thêm nhóm SP' : 'Lưu thay đổi')}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
