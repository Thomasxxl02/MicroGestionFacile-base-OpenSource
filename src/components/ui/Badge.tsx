import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'emerald' | 'amber' | 'red' | 'slate' | 'violet' | 'rose' | 'warning';
  className?: string;
  dot?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'slate', className = '', dot }) => {
  const variants = {
    blue: 'bg-primary/10 text-primary border-primary/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    red: 'bg-destructive/10 text-destructive border-destructive/20',
    slate: 'bg-muted text-muted-foreground border-border',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  };

  const dots = {
    blue: 'bg-primary',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    warning: 'bg-amber-500',
    red: 'bg-destructive',
    slate: 'bg-muted-foreground',
    violet: 'bg-violet-500',
    rose: 'bg-rose-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm ${variants[variant]} ${className}`}
    >
      {dot && (
        <span className={`w-2 h-2 rounded-full ring-2 ring-current/20 ${dots[variant]}`}></span>
      )}
      {children}
    </span>
  );
};

export default Badge;
