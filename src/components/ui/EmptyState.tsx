import React from 'react';
import { LucideIcon } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  'data-testid'?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  'data-testid': dataTestId,
}) => {
  return (
    <div
      data-testid={dataTestId}
      className={`py-32 flex flex-col items-center justify-center bg-card dark:bg-card rounded-5xl border-2 border-dashed border-border transition-all duration-500 hover:border-primary/20 hover:bg-muted/30 group ${className}`}
    >
      <div className="w-28 h-28 bg-muted dark:bg-muted rounded-4xl flex items-center justify-center text-muted-foreground/30 mb-8 border-4 border-card shadow-premium transition-all group-hover:scale-110 group-hover:rotate-3 duration-500">
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <h3 className="text-3xl font-black text-foreground tracking-tighter">{title}</h3>
      <p className="text-muted-foreground mt-3 max-w-sm text-center px-6 font-medium leading-relaxed opacity-70">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          variant="gradient"
          size="lg"
          className="mt-12 px-10 shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
