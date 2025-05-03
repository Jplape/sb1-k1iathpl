import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Product = Database['public']['Tables']['products']['Row'];

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setProduct(data);
      } catch (error) {
        toast.error('Error loading product');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchProduct();
    }
  }, [id, navigate]);

  const handleCheckout = async () => {
    if (!product) return;

    setProcessing(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          price: product.price,
        }),
      });

      const session = await response.json();

      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      toast.error('Payment failed. Please try again.');
      console.error('Error:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <img
            src={product.images[0] || 'https://via.placeholder.com/100'}
            alt={product.title}
            className="h-20 w-20 object-cover rounded"
          />
          <div>
            <h3 className="font-semibold">{product.title}</h3>
            <p className="text-gray-600">{product.description.substring(0, 100)}...</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between mb-2">
            <span>Price</span>
            <span>${product.price}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Service Fee</span>
            <span>${(product.price * 0.05).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span>${(product.price * 1.05).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Button
        onClick={handleCheckout}
        className="w-full"
        disabled={processing}
      >
        {processing ? 'Processing...' : 'Proceed to Payment'}
      </Button>
    </div>
  );
}