import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: LucideIcon;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/20';

  const variants = {
    primary:
      'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 dark:shadow-none',
    gradient:
      'bg-gradient-to-br from-primary to-blue-600 text-white hover:shadow-xl hover:shadow-primary/30 shadow-lg shadow-primary/20 dark:shadow-none',
    secondary:
      'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-soft border border-border',
    danger:
      'bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20 transition-colors',
    success:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition-colors',
    ghost: 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
    outline:
      'bg-transparent text-foreground border-2 border-border hover:border-primary hover:text-primary transition-all',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-10 py-4 text-base',
    icon: 'p-3',
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {loading ? (
        <span className="w-5 h-5 border-2 border-current/20 border-t-current rounded-full animate-spin"></span>
      ) : (
        Icon && <Icon size={size === 'sm' ? 16 : 20} className={size !== 'icon' ? 'mr-0.5' : ''} />
      )}
      {size !== 'icon' && children}
    </button>
  );
};

export default Button;
