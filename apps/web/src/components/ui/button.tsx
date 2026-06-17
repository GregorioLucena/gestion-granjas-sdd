import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  icon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white shadow-sm shadow-primary/20 hover:bg-primary-dark focus:ring-primary/25',
  secondary:
    'bg-secondary text-primary-dark shadow-sm shadow-secondary/30 hover:bg-secondary/85 focus:ring-secondary/30',
  danger: 'bg-danger text-white shadow-sm shadow-danger/20 hover:bg-danger/90 focus:ring-danger/25',
  ghost: 'bg-transparent text-primary hover:bg-primary/10 focus:ring-primary/20',
  outline:
    'bg-surface text-foreground ring-1 ring-black/10 hover:border-primary hover:text-primary focus:ring-primary/20',
};

export function Button({
  variant = 'primary',
  fullWidth = false,
  icon,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
        fullWidth ? 'w-full' : ''
      } ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
