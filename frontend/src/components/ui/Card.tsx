import React from 'react';
import { cn } from '@/lib/utils';
import { CardProps } from '@/types';

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, title, subtitle, footer, padding = 'md', border = true, shadow = true, children, ...props }, ref) => {
    const baseClasses = 'rounded-lg';

    const paddings = {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    const borders = border ? 'border border-gray-200' : '';
    const shadows = shadow ? 'shadow-sm' : '';

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          paddings[padding],
          borders,
          shadows,
          className
        )}
        {...props}
      >
        {(title || subtitle) && (
          <div className="mb-4">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="text-gray-800">
          {children}
        </div>

        {footer && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';