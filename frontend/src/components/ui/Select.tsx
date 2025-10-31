import React from 'react';
import { cn } from '@/lib/utils';
import { BaseComponentProps } from '@/types';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends BaseComponentProps {
  options: SelectOption[];
  placeholder?: string;
  value?: string | string[];
  defaultValue?: string | string[];
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
  multiple?: boolean;
  onChange?: (value: string | string[]) => void;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className,
    options,
    placeholder,
    value,
    defaultValue,
    disabled = false,
    required = false,
    error,
    label,
    helperText,
    multiple = false,
    onChange,
    ...props
  }, ref) => {
    const baseClasses = 'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50';

    const errorClasses = error ? 'border-red-500 focus:ring-red-500' : '';

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (multiple) {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        onChange?.(selectedOptions);
      } else {
        onChange?.(e.target.value);
      }
    };

    // Handle multiple select value properly
    const selectValue = multiple ? (value || []) : (value || '');

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <select
          ref={ref}
          className={cn(baseClasses, errorClasses, className, multiple && 'py-1')}
          value={selectValue}
          defaultValue={defaultValue}
          disabled={disabled}
          required={required}
          multiple={multiple}
          onChange={handleChange}
          {...props}
        >
          {!multiple && placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}

          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';