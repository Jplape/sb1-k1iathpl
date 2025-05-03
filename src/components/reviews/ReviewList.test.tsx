import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewList } from './ReviewList';

const mockReviews = [
  {
    id: '1',
    product_id: 'product-1',
    user_id: 'user-1',
    rating: 5,
    comment: 'Excellent produit !',
    created_at: '2025-03-15T10:00:00Z',
    user: {
      full_name: 'Jean Dupont'
    }
  },
  {
    id: '2',
    product_id: 'product-1',
    user_id: 'user-2',
    rating: 4,
    comment: 'Très satisfait',
    created_at: '2025-03-14T15:30:00Z',
    user: {
      full_name: 'Marie Martin'
    }
  }
];

describe('ReviewList', () => {
  it('affiche la liste des avis correctement', () => {
    render(<ReviewList reviews={mockReviews} />);
    
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('Marie Martin')).toBeInTheDocument();
    expect(screen.getByText('Excellent produit !')).toBeInTheDocument();
    expect(screen.getByText('Très satisfait')).toBeInTheDocument();
  });

  it('affiche "Utilisateur" quand le nom est manquant', () => {
    const reviewsWithoutName = [
      {
        ...mockReviews[0],
        user: { full_name: null }
      }
    ];
    
    render(<ReviewList reviews={reviewsWithoutName} />);
    expect(screen.getByText('Utilisateur')).toBeInTheDocument();
  });

  it('affiche la date au format français', () => {
    render(<ReviewList reviews={mockReviews} />);
    expect(screen.getByText(/15 mars 2025 à/i)).toBeInTheDocument();
  });

  it('affiche une liste vide quand il n\'y a pas d\'avis', () => {
    const { container } = render(<ReviewList reviews={[]} />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });
});