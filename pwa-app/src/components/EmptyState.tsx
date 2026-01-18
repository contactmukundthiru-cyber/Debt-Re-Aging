'use client';

import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'compact' | 'large';
}

const defaultIcons = {
  empty: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  success: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  search: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  calendar: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  chart: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  scale: (
    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  ),
};

const variantStyles = {
  default: 'p-12',
  compact: 'p-6',
  large: 'p-16',
};

/**
 * Reusable empty state component for when no data is available
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) {
  return (
    <div className={`panel-inset text-center ${variantStyles[variant]}`}>
      <div className="mx-auto mb-3 text-gray-300">
        {icon || defaultIcons.empty}
      </div>
      <h3 className="heading-md mb-1">{title}</h3>
      {description && (
        <p className="body-sm text-gray-500 max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 btn btn-secondary text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Pre-configured empty states for common use cases
export function NoViolationsState() {
  return (
    <EmptyState
      icon={defaultIcons.success}
      title="No Obvious Violations"
      description="Manual review by a professional is still recommended."
    />
  );
}

export function NoPatternsState() {
  return (
    <EmptyState
      icon={defaultIcons.chart}
      title="No Patterns Detected"
      description="No significant reporting patterns were identified in this account."
    />
  );
}

export function NoTimelineState() {
  return (
    <EmptyState
      icon={defaultIcons.calendar}
      title="No Timeline Events"
      description="Add dates to your account data to see a chronological timeline."
    />
  );
}

export function NoCaseLawState() {
  return (
    <EmptyState
      icon={defaultIcons.scale}
      title="No Case Law Matches"
      description="No specific legal precedents were found for the detected violations."
    />
  );
}

export function NoSearchResultsState({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={defaultIcons.search}
      title="No Results Found"
      description={query ? `No matches found for "${query}"` : 'Try adjusting your search criteria.'}
    />
  );
}

export function NoHistoryState() {
  return (
    <EmptyState
      icon={defaultIcons.empty}
      title="No Analysis History"
      description="Your previous analyses will appear here."
      variant="compact"
    />
  );
}

export default EmptyState;
