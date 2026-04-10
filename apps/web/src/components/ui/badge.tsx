import React from 'react';
type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';

const baseClass = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-900',
  success: 'bg-emerald-100 text-emerald-900',
  warning: 'bg-amber-100 text-amber-900',
  error: 'bg-red-100 text-red-900',
  info: 'bg-blue-100 text-blue-900',
  primary: 'bg-primary-100 text-primary-900'
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={[baseClass, variantClasses[variant], className].filter(Boolean).join(' ')}
      {...props}
    />
  )
);
Badge.displayName = 'Badge';

export { Badge };
