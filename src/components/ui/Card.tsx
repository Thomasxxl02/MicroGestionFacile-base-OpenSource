import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  footer?: React.ReactNode;
  headerActions?: React.ReactNode;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  className = '',
  footer,
  headerActions,
  hoverable = false,
}) => {
  return (
    <div
      className={`
      bg-card dark:bg-card border border-border rounded-3xl overflow-hidden transition-all duration-500
      ${hoverable ? 'hover:shadow-premium-hover hover:-translate-y-1 hover:border-primary/20' : 'shadow-premium'}
      ${className}
    `}
    >
      {(title || headerActions) && (
        <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-card/50 dark:bg-card/30">
          <div>
            {title && (
              <h3 className="text-xl font-bold text-foreground tracking-tight leading-none">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-2 font-medium">{subtitle}</p>
            )}
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}
      <div className="p-8">{children}</div>
      {footer && (
        <div className="px-8 py-5 bg-muted/30 border-t border-border mt-auto">{footer}</div>
      )}
    </div>
  );
};

export default Card;
