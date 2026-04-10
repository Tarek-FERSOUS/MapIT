import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={`
          w-full px-3 py-2 rounded-md border
          ${error ? 'border-red-500' : 'border-slate-300'}
          text-slate-900 placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
          disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-slate-500">{helperText}</p>
      )}
    </div>
  )
);
Input.displayName = 'Input';

export { Input };
