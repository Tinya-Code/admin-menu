export type RuleType = 'DAY' | 'PROMOTION';

export interface ProductPrice {
  id?: number | string;
  productId?: number | string;
  price: string;
  name?: string;
  description?: string;
  startDay: number | null;
  endDay: number | null;
  startDatetime: string | null;
  endDatetime: string | null;
  ruleType: RuleType;
}

export interface PriceRange {
  id?: number;
  productId?: number;
  quantity: string;
  unit: string;
  price: string;
  bonus: string | null;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}
