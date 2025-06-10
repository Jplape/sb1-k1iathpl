import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmailNotConfirmedBanner } from '../EmailNotConfirmedBanner';
import { vi } from 'vitest';

// Mock ResendConfirmationButton pour éviter les dépendances externes
vi.mock('../ResendConfirmationButton', () => ({
  ResendConfirmationButton: ({ email }: { email: string }) => (
    <button data-testid="resend-button">Renvoyer l'email à {email}</button>
  ),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('EmailNotConfirmedBanner', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('renders correctly with email', () => {
    render(<EmailNotConfirmedBanner email="test@example.com" />);
    
    expect(screen.getByText(/Confirmation d'email requise/i)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    expect(screen.getByTestId('resend-button')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onCloseMock = vi.fn();
    render(<EmailNotConfirmedBanner email="test@example.com" onClose={onCloseMock} />);
    
    fireEvent.click(screen.getByRole('button', { name: /fermer/i }));
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('emailBannerDismissedUntil')).not.toBeNull();
  });

  it('does not render when previously dismissed', () => {
    // Set localStorage to simulate a previously dismissed banner
    const futureTime = Date.now() + 1000 * 60 * 60; // 1 hour in the future
    localStorage.setItem('emailBannerDismissedUntil', futureTime.toString());
    
    const { container } = render(<EmailNotConfirmedBanner email="test@example.com" />);
    
    // Banner should not be rendered
    expect(container.firstChild).toBeNull();
  });

  it('applies custom className', () => {
    render(<EmailNotConfirmedBanner email="test@example.com" className="custom-class" />);
    
    const banner = screen.getByText(/Confirmation d'email requise/i).closest('div');
    expect(banner).toHaveClass('custom-class');
  });
});
