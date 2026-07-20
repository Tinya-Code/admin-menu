export interface Banner {
  id: string;
  restaurantId: string;
  title: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BannerFormData {
  title: string;
  isActive: boolean;
  image: File | null;
  imageUrl: string | null;
}
