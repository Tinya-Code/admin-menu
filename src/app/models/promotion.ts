import { ProductPrice } from './product-price';

export interface Promotion extends ProductPrice {
  id: string;
  productId: string;
  productName: string;
  productPrice: string;
  productImage: string | null;
}
