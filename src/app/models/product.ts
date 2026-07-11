export interface Product {
  id: number;
  name: string;
  description: string;
  price: number | null;
  category_id: string | null;
  price_range_id: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  prices?: {
    id?: string;
    product_id?: string;
    name?: string;
    price: number;
    start_day: number | null;
    end_day: number | null;
    start_datetime: string | null;
    end_datetime: string | null;
    rule_type: 'DAY' | 'PROMOTION';
  }[] | null;
  price_ranges?: {
    id?: string;
    quantity: number;
    unit: string;
    price: number;
    bonus: string | null;
    sort_order: number;
    is_default: boolean;
  }[] | null;
}

export interface ProductFormData {
  name: string;
  description: string;
  categoryId: string | null;
  priceType: 'fixed' | 'variable';
  basePrice: number | null;
  status: boolean;
}
