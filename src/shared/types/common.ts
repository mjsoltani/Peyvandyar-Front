// Common shared types
export interface User {
  username: string;
  basalam_user_id: number;
  basalam_vendor_id: number;
  vendor_title: string;
  last_used_at?: string;
}

export interface Product {
  id: number;
  title: string;
  primary_price: number;
  stock: number;
  image?: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: number;
  primary_price: number;
  stock: number;
  attributes?: Record<string, string>;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type PaymentStatus = 'success' | 'failed' | 'pending' | 'unverified';
