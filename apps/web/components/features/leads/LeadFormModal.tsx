'use client';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadFormSchema, LeadFormData } from '@/lib/validations/lead.schema';
import { FormInput, FormSelect, FormTextarea } from '@/components/ui/form';
import { CUSTOMER_GROUPS } from '@/lib/types';
import { PlusCircle, Edit, X } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface LeadFormModalProps {
  mode: 'add' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<boolean>;
  defaultValues?: any;
  sources: Array<{ id: number; name: string; type: string }>;
  campaigns: Array<{ id: number; name: string }>;
  productGroups: Array<{ id: number; name: string }>;
}

export function LeadFormModal({
  mode, isOpen, onClose, onSubmit, defaultValues, sources, campaigns, productGroups
}: LeadFormModalProps) {
  const methods = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      demand: '',
      source_id: sources[0]?.id || 0,
      campaign_id: undefined,
      customer_group: '',
      interested_product_group_id: undefined,
    },
  });

  useEffect(() => {
    if (defaultValues && mode === 'edit') {
      methods.reset({
        full_name: defaultValues.full_name || '',
        phone: defaultValues.phone || '',
        email: defaultValues.email || '',
        demand: defaultValues.demand || '',
        source_id: defaultValues.source_id || sources[0]?.id || 0,
        campaign_id: defaultValues.campaign_id,
        customer_group: defaultValues.customer_group || '',
        interested_product_group_id: defaultValues.interested_product_group_id,
      });
    } else if (mode === 'add') {
      methods.reset({
        full_name: '',
        phone: '',
        email: '',
        demand: '',
        source_id: sources[0]?.id || 0,
        campaign_id: undefined,
        customer_group: '',
        interested_product_group_id: undefined,
      });
    }
  }, [defaultValues, mode, methods, sources]);

  const handleSubmit = async (data: LeadFormData) => {
    const success = await onSubmit(data);
    if (success) {
      toast.success(mode === 'add' ? 'Đã thêm lead thành công!' : 'Đã cập nhật lead thành công!');
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
              <><PlusCircle className="text-accent" /> Thêm khách hàng tiềm năng mới</>
            ) : (
              <><Edit className="text-accent" /> Chỉnh sửa thông tin Lead</>
            )}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X size={20} />
          </button>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
            <FormInput
              name="full_name"
              label="Họ và tên"
              placeholder="Nhập họ và tên"
              required
            />

            <FormInput
              name="phone"
              label="Số điện thoại"
              type="tel"
              placeholder="0901234567"
              required
            />

            <FormInput
              name="email"
              label="Email"
              type="email"
              placeholder="example@email.com"
            />

            <FormSelect
              name="source_id"
              label="Nguồn"
              required
              options={sources.map(s => ({ value: s.id, label: `${s.name} (${s.type})` }))}
            />

            <FormSelect
              name="campaign_id"
              label="Chiến dịch"
              options={campaigns.map(c => ({ value: c.id, label: c.name }))}
              emptyOption="-- Chọn chiến dịch --"
            />

            <FormSelect
              name="customer_group"
              label="Nhóm khách hàng"
              options={CUSTOMER_GROUPS.map(g => ({ value: g, label: g }))}
              emptyOption="-- Chọn nhóm KH --"
            />

            <FormSelect
              name="interested_product_group_id"
              label="Nhóm sản phẩm quan tâm"
              options={productGroups.map(g => ({ value: g.id, label: g.name }))}
              emptyOption="-- Chọn nhóm SP --"
            />

            <FormTextarea
              name="demand"
              label="Nhu cầu"
              placeholder="Nhập nhu cầu của khách hàng"
              rows={3}
            />

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
                {methods.formState.isSubmitting ? 'Đang xử lý...' : (mode === 'add' ? 'Thêm mới' : 'Lưu thay đổi')}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
