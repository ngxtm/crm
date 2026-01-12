'use client';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { salesEmployeeSchema, SalesEmployeeFormData } from '@/lib/validations/sales-employee.schema';
import { FormInput } from '@/components/ui/form';
import { PlusCircle, Edit, X } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface SalesEmployeeFormModalProps {
  mode: 'add' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
  defaultValues?: any;
}

export function SalesEmployeeFormModal({
  mode, isOpen, onClose, onSubmit, defaultValues
}: SalesEmployeeFormModalProps) {
  const methods = useForm<SalesEmployeeFormData>({
    resolver: zodResolver(salesEmployeeSchema),
    defaultValues: {
      employee_code: '',
      full_name: '',
      email: '',
      phone: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (defaultValues && mode === 'edit') {
      methods.reset({
        employee_code: defaultValues.employee_code || '',
        full_name: defaultValues.full_name || '',
        email: defaultValues.email || '',
        phone: defaultValues.phone || '',
        is_active: defaultValues.is_active ?? true,
      });
    } else if (mode === 'add') {
      methods.reset({
        employee_code: '',
        full_name: '',
        email: '',
        phone: '',
        is_active: true,
      });
    }
  }, [defaultValues, mode, methods]);

  const handleSubmit = async (data: SalesEmployeeFormData) => {
    const success = await onSubmit(data);
    if (success) {
      toast.success(mode === 'add' ? 'Đã thêm nhân viên thành công!' : 'Đã cập nhật nhân viên thành công!');
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
              <><PlusCircle className="text-accent" /> Thêm nhân viên sale mới</>
            ) : (
              <><Edit className="text-accent" /> Chỉnh sửa nhân viên sale</>
            )}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X size={20} />
          </button>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
            <FormInput
              name="employee_code"
              label="Mã nhân viên"
              placeholder="NV001"
              required
              disabled={mode === 'edit'}
            />

            <FormInput
              name="full_name"
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              required
            />

            <FormInput
              name="email"
              label="Email"
              type="email"
              placeholder="nva@company.com"
              required
            />

            <FormInput
              name="phone"
              label="Số điện thoại"
              type="tel"
              placeholder="0901234567"
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
                  Nhân viên đang hoạt động
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
                {methods.formState.isSubmitting ? 'Đang xử lý...' : (mode === 'add' ? 'Thêm nhân viên' : 'Lưu thay đổi')}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
