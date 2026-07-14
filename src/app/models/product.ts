import { ProductPrice, PriceRange } from './product-price';

export type { ProductPrice, PriceRange };

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string | null;
  restaurantId: string;
  categoryId: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  prices?: ProductPrice[] | null;
  priceRanges?: PriceRange[] | null;
}

export interface ProductFormData {
  name: string;
  description: string;
  categoryId: string | null;
  priceType: 'fixed' | 'variable';
  basePrice: number | null;
  status: boolean;
}
