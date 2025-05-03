import type { Database } from './supabase';

export type Product = Database['public']['Tables']['products']['Row'] & {
  profiles?: {
    full_name: string | null;
    role: string | null;
  } | null;
  rating?: number;
  review_count?: number;
  description_ai?: string;
  premium_photos?: boolean;
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'pro' | 'admin';
  createdAt: string;
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  userId: string;
  featured: boolean;
  urgent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  product?: {
    title: string;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  content_type: 'product' | 'message' | 'user';
  content_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  user?: {
    full_name: string | null;
  };
}