export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface EventForm {
  name: string;
  description: string;
  date: string;
  time: string;
}
