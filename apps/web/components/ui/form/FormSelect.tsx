'use client';
import { useFormContext } from 'react-hook-form';

interface FormSelectProps {
  name: string;
  label: string;
  options: Array<{ value: number | string; label: string }>;
  required?: boolean;
  emptyOption?: string;
  disabled?: boolean;
}

export function FormSelect({
  name, label, options, required, emptyOption, disabled
}: FormSelectProps) {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        {...register(name, {
          valueAsNumber: options.length > 0 && typeof options[0]?.value === 'number'
        })}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors
          ${error
            ? 'border-red-500 focus:ring-2 focus:ring-red-500'
            : 'border-slate-300 focus:ring-2 focus:ring-accent'}
          ${disabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}
        `}
      >
        {emptyOption && <option value="">{emptyOption}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error.message as string}</p>}
    </div>
  );
}
