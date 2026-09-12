import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  error?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  select?: boolean;
  options?: { value: string; label: string }[];
  textarea?: boolean;
  helperText?: string;
  className?: string;
  value?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

const FormField = forwardRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, FormFieldProps>(
  ({ label, error, type = 'text', icon, children, select, options, textarea, helperText, className = '', ...props }, ref) => {
    const inputClassName = `
      block w-full py-2 px-3 border rounded-md shadow-sm placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm
      bg-white dark:bg-gray-800
      text-gray-900 dark:text-white
      border-gray-300 dark:border-gray-600
      hover:border-gray-400 dark:hover:border-gray-500
      ${error ? 'border-red-300 dark:border-red-600 text-red-900 dark:text-red-100 placeholder-red-300 focus:border-red-500 focus:ring-red-500' : ''}
      disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400
      ${className}
    `.trim();

    const labelClassName = `block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200`;

    const selectClassName = `${inputClassName} ${icon ? 'pl-10' : ''} pr-10 appearance-none`;

    return (
      <div className="w-full">
        <label className={labelClassName}>{label}</label>
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              {icon}
            </div>
          )}
          {select ? (
            <select
              ref={ref as any}
              className={selectClassName}
              {...props}
            >
              {options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : textarea ? (
            <textarea
              ref={ref as any}
              className={`${inputClassName} ${icon ? 'pl-10' : ''} resize-y min-h-[80px]`}
              {...props}
            />
          ) : (
            <input
              ref={ref as any}
              type={type}
              className={`${inputClassName} ${icon ? 'pl-10' : ''}`}
              {...props}
            />
          )}
          {children}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle size={14} /> {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export { FormField };