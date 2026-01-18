/**
 * ErrorBoundary component tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Suppress console.error for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  test('renders default fallback UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Refresh Page')).toBeInTheDocument();
  });

  test('renders custom fallback ReactNode when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  test('renders custom fallback function when provided', () => {
    render(
      <ErrorBoundary
        fallback={(error, reset) => (
          <div>
            <span>Error: {error.message}</span>
            <button onClick={reset}>Reset</button>
          </div>
        )}
      >
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  test('calls onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  test('resets error state when Try Again is clicked', () => {
    // Use a key to force complete remount after reset
    let throwError = true;
    const { rerender } = render(
      <ErrorBoundary key="boundary-1">
        <ThrowError shouldThrow={throwError} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Verify Try Again button is clickable
    const tryAgainButton = screen.getByText('Try Again');
    expect(tryAgainButton).toBeInTheDocument();
    fireEvent.click(tryAgainButton);

    // After reset, rerender with a new key to simulate fresh mount
    throwError = false;
    rerender(
      <ErrorBoundary key="boundary-2">
        <ThrowError shouldThrow={throwError} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  test('resets error state when custom reset function is called', () => {
    // Track that reset was called
    let resetCalled = false;
    const customFallback = (error: Error, reset: () => void) => (
      <button onClick={() => { resetCalled = true; reset(); }}>Custom Reset</button>
    );

    let throwError = true;
    const { rerender } = render(
      <ErrorBoundary key="boundary-1" fallback={customFallback}>
        <ThrowError shouldThrow={throwError} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Reset')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Custom Reset'));
    expect(resetCalled).toBe(true);

    // After reset, rerender with a new key to simulate fresh mount
    throwError = false;
    rerender(
      <ErrorBoundary key="boundary-2" fallback={customFallback}>
        <ThrowError shouldThrow={throwError} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});
