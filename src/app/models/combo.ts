export interface Combo {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComboForm {
  name: string;
  description: string;
  price: number;
}
