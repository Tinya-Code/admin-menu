export interface Combo {
  id: number;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_active: number;
}

export interface ComboForm {
  name: string;
  description: string;
  price: number;
}
