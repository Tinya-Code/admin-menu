export interface Category {
  id: string;
  name: string;
  description: string;
  block_id: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryForm {
  name: string;
  description: string;
  block_id: string;
}
