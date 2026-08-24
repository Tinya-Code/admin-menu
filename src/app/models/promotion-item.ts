export interface PromotionItem {
  id: number;
  name: string;
  description: string | null;
  basePrice: string | null;
  promoPrice: string;
  startDate: string | null;
  endDate: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

export interface PromotionForm {
  name: string;
  description: string | null;
  basePrice: number | null;
  promoPrice: number;
  startDate: string | null;
  endDate: string | null;
}
