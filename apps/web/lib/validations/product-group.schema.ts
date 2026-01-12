import { z } from 'zod';

const GROUP_CODE_REGEX = /^[A-Z0-9]+$/;

export const productGroupSchema = z.object({
  name: z.string()
    .min(1, 'Tên nhóm là bắt buộc')
    .min(2, 'Tên nhóm phải có ít nhất 2 ký tự')
    .max(100, 'Tên nhóm tối đa 100 ký tự'),

  code: z.string()
    .min(1, 'Mã nhóm là bắt buộc')
    .regex(GROUP_CODE_REGEX, 'Mã nhóm chỉ chứa CHỮ IN HOA và SỐ (VD: BOX, HP01)')
    .max(20, 'Mã nhóm tối đa 20 ký tự'),

  description: z.string()
    .max(500, 'Mô tả tối đa 500 ký tự')
    .optional()
    .or(z.literal('')),

  is_active: z.boolean(),
});

export type ProductGroupFormData = z.infer<typeof productGroupSchema>;
