'use client';

import React from 'react';
import { cn } from '../lib/utils';

type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card' | 'line' | 'block';

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  width?: string | number;
  height?: string | number;
  /** Number of lines for text variant */
  lines?: number;
  /** Accessible label for screen readers */
  'aria-label'?: string;
}

const baseClass =
  'animate-pulse rounded-md bg-slate-200 dark:bg-slate-700';

/**
 * Skeleton placeholder for loading states. Use for cards, text, avatars, etc.
 */
export function Skeleton({
  variant = 'rectangular',
  className,
  width,
  height,
  lines = 1,
  'aria-label': ariaLabel = 'Loading',
}: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)} role="status" aria-label={ariaLabel}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseClass, 'h-4')}
            style={i === lines - 1 && lines > 1 ? { width: '75%' } : undefined}
          />
        ))}
      </div>
    );
  }

  const variantClass = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: '',
    card: 'rounded-xl h-32',
    line: 'h-px',
    block: 'rounded-lg h-24',
  }[variant];

  return (
    <div
      className={cn(baseClass, variantClass, className)}
      style={Object.keys(style).length ? style : undefined}
      role="status"
      aria-label={ariaLabel}
    />
  );
}

/**
 * Card-shaped skeleton with title + 3 lines of text
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4',
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <Skeleton variant="rectangular" className="h-6 w-2/3" />
      <Skeleton variant="text" lines={3} />
    </div>
  );
}

/**
 * Table row skeleton (e.g. for analysis results)
 */
export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div
      className="flex gap-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
      role="status"
      aria-label="Loading row"
    >
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          variant="rectangular"
          className={cn('h-4 flex-1', i === 0 ? 'max-w-[120px]' : '')}
        />
      ))}
    </div>
  );
}

export default Skeleton;
