export interface Promotion {
  id: string;
  product_id: string;
  price: string;
  name: string;
  description: string | null;
  start_day: number | null;
  end_day: number | null;
  start_datetime: string | null;
  end_datetime: string | null;
  rule_type: 'DAY' | 'PROMOTION';
  product_name: string;
  product_price: string;
  product_image: string | null;
}
