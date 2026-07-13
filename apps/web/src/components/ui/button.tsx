import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  icon?: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white shadow-md shadow-primary/25 hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/30 focus:ring-primary/30 active:scale-[0.98]',
  secondary:
    'bg-secondary text-primary-dark shadow-md shadow-secondary/35 hover:brightness-105 focus:ring-secondary/40 active:scale-[0.98]',
  danger:
    'bg-danger text-white shadow-md shadow-danger/25 hover:brightness-110 focus:ring-danger/30 active:scale-[0.98]',
  ghost: 'bg-transparent text-primary hover:bg-primary/10 focus:ring-primary/20',
  outline:
    'bg-surface/90 text-foreground ring-1 ring-primary/15 hover:bg-primary/5 hover:text-primary hover:ring-primary/30 focus:ring-primary/20',
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
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold outline-none transition duration-200 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
        fullWidth ? 'w-full' : ''
      } ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
