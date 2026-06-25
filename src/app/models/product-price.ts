export type RuleType = 'DAY' | 'PROMOTION';

export interface ProductPrice {
  id?: string;
  product_id?: string;
  price: number;
  start_day: number | null;
  end_day: number | null;
  start_datetime: string | null;
  end_datetime: string | null;
  rule_type: RuleType;
}

export interface ProductPriceForm {
  product_id?: string;
  price: number;
  rule_type: RuleType;
  start_day?: number | null;
  end_day?: number | null;
  start_datetime?: string | null;
  end_datetime?: string | null;
}
