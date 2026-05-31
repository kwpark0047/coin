import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'outline' | 'default';
  className?: string;
  children: ReactNode;
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variant === 'outline' ? 'border border-gray-300 text-gray-600' : 'bg-gray-100 text-gray-800',
        className
      )}
    >
      {children}
    </span>
  );
}
