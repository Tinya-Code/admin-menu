export interface Gallery {
  id: string;
  title: string;
  description: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface GalleryForm {
  name: string;
  description: string;
}
