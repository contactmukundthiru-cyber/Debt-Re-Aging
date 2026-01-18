/**
 * Toast component tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastItem, ToastContainer } from '../components/Toast';
import { Toast as ToastType } from '../hooks/useToast';

describe('ToastItem', () => {
  const defaultToast: ToastType = {
    id: 'toast-1',
    message: 'Test message',
    type: 'info',
  };

  test('renders toast message', () => {
    render(<ToastItem toast={defaultToast} onDismiss={jest.fn()} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  test('renders success toast with correct styling', () => {
    const successToast: ToastType = { ...defaultToast, type: 'success' };
    render(<ToastItem toast={successToast} onDismiss={jest.fn()} />);

    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-green-600');
  });

  test('renders error toast with correct styling', () => {
    const errorToast: ToastType = { ...defaultToast, type: 'error' };
    render(<ToastItem toast={errorToast} onDismiss={jest.fn()} />);

    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-red-600');
  });

  test('renders warning toast with correct styling', () => {
    const warningToast: ToastType = { ...defaultToast, type: 'warning' };
    render(<ToastItem toast={warningToast} onDismiss={jest.fn()} />);

    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-amber-500');
  });

  test('renders info toast with correct styling', () => {
    render(<ToastItem toast={defaultToast} onDismiss={jest.fn()} />);

    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('bg-gray-900');
  });

  test('calls onDismiss when close button is clicked (after animation delay)', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(<ToastItem toast={defaultToast} onDismiss={onDismiss} />);

    const closeButton = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(closeButton);

    // onDismiss is called after 200ms animation delay
    expect(onDismiss).not.toHaveBeenCalled();
    jest.advanceTimersByTime(200);
    expect(onDismiss).toHaveBeenCalledWith('toast-1');

    jest.useRealTimers();
  });

  test('has correct accessibility attributes', () => {
    render(<ToastItem toast={defaultToast} onDismiss={jest.fn()} />);

    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });
});

describe('ToastContainer', () => {
  const toasts: ToastType[] = [
    { id: 'toast-1', message: 'First message', type: 'success' },
    { id: 'toast-2', message: 'Second message', type: 'error' },
    { id: 'toast-3', message: 'Third message', type: 'warning' },
  ];

  test('renders multiple toasts', () => {
    render(<ToastContainer toasts={toasts} onDismiss={jest.fn()} />);

    expect(screen.getByText('First message')).toBeInTheDocument();
    expect(screen.getByText('Second message')).toBeInTheDocument();
    expect(screen.getByText('Third message')).toBeInTheDocument();
  });

  test('renders nothing when toasts array is empty', () => {
    const { container } = render(<ToastContainer toasts={[]} onDismiss={jest.fn()} />);

    // Container should still exist but have no toast children
    expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument();
  });

  test('calls onDismiss with correct toast id (after animation delay)', () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);

    const closeButtons = screen.getAllByRole('button', { name: /dismiss/i });
    fireEvent.click(closeButtons[1]); // Click second toast's close button

    // onDismiss is called after 200ms animation delay
    jest.advanceTimersByTime(200);
    expect(onDismiss).toHaveBeenCalledWith('toast-2');

    jest.useRealTimers();
  });

  test('has fixed positioning for overlay', () => {
    const { container } = render(<ToastContainer toasts={toasts} onDismiss={jest.fn()} />);

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toHaveClass('fixed');
    expect(overlay).toHaveClass('top-4');
    expect(overlay).toHaveClass('right-4');
  });
});
