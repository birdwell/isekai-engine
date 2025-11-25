import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationToast, Notification } from './index';

describe('NotificationToast', () => {
  it('renders nothing when notification is null', () => {
    const { container } = render(<NotificationToast notification={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders success toast with CheckCircle icon', () => {
    const notification: Notification = { msg: 'Success!', type: 'success' };
    render(<NotificationToast notification={notification} />);
    expect(screen.getByText('Success!')).toBeInTheDocument();
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('w-5', 'h-5');
  });

  it('renders error toast with AlertCircle icon', () => {
    const notification: Notification = { msg: 'Error occurred', type: 'error' };
    render(<NotificationToast notification={notification} />);
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('w-5', 'h-5');
  });

  it('displays the notification message correctly', () => {
    const notification: Notification = { msg: 'Test message content', type: 'success' };
    render(<NotificationToast notification={notification} />);
    const messageSpan = screen.getByText('Test message content');
    expect(messageSpan).toBeInTheDocument();
    expect(messageSpan).toHaveClass('font-bold', 'text-sm', 'tracking-wide');
  });

  it('has correct CSS classes for success type', () => {
    const notification: Notification = { msg: 'Success', type: 'success' };
    render(<NotificationToast notification={notification} />);
    const toast = screen.getByText('Success').closest('div');
    expect(toast).toHaveClass('bg-slate-800', 'border-emerald-500/50', 'text-emerald-400');
  });

  it('has correct CSS classes for error type', () => {
    const notification: Notification = { msg: 'Error', type: 'error' };
    render(<NotificationToast notification={notification} />);
    const toast = screen.getByText('Error').closest('div');
    expect(toast).toHaveClass('bg-slate-800', 'border-red-500/50', 'text-red-400');
  });
});
