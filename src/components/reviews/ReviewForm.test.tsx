import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewForm } from './ReviewForm';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// Mock des dépendances
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

describe('ReviewForm', () => {
  const mockUser = { id: 'user-123' };
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ user: mockUser } as any);
  });

  it('affiche le formulaire correctement', () => {
    render(<ReviewForm productId="product-123" />);
    
    expect(screen.getByLabelText(/note/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/commentaire/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /envoyer/i })).toBeInTheDocument();
  });

  it('affiche une erreur si le commentaire est trop court', async () => {
    render(<ReviewForm productId="product-123" />);
    
    const commentInput = screen.getByLabelText(/commentaire/i);
    await userEvent.type(commentInput, 'Court');
    
    const submitButton = screen.getByRole('button', { name: /envoyer/i });
    await userEvent.click(submitButton);
    
    expect(await screen.findByText(/le commentaire doit faire au moins 10 caractères/i))
      .toBeInTheDocument();
  });

  it('soumet le formulaire avec succès', async () => {
    render(<ReviewForm productId="product-123" onSuccess={mockOnSuccess} />);
    
    // Sélectionner une note
    const stars = screen.getAllByRole('button');
    await userEvent.click(stars[4]); // 5 étoiles
    
    // Écrire un commentaire
    const commentInput = screen.getByLabelText(/commentaire/i);
    await userEvent.type(commentInput, 'Un excellent produit, je recommande !');
    
    // Soumettre le formulaire
    const submitButton = screen.getByRole('button', { name: /envoyer/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('reviews');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('gère les erreurs de soumission', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn(() => Promise.resolve({ error: new Error('Erreur test') }))
    } as any);

    render(<ReviewForm productId="product-123" />);
    
    // Sélectionner une note
    const stars = screen.getAllByRole('button');
    await userEvent.click(stars[4]);
    
    // Écrire un commentaire
    const commentInput = screen.getByLabelText(/commentaire/i);
    await userEvent.type(commentInput, 'Un excellent produit, je recommande !');
    
    // Soumettre le formulaire
    const submitButton = screen.getByRole('button', { name: /envoyer/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/une erreur s'est produite/i)).toBeInTheDocument();
    });
  });
});