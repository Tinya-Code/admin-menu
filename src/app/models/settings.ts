export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export const DAY_NAMES_ES: Record<DayOfWeek, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export type PaymentMethod = 'cash' | 'card' | 'yape' | 'plin';

export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'yape', 'plin'];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  yape: 'Yape',
  plin: 'Plin',
};

export const WHATSAPP_MESSAGE_MAX_LENGTH = 500;
export const MAX_DELIVERY_ZONES = 10;

export interface BusinessHours {
  open: string;
  close: string;
  isOpen: boolean;
}

export interface DayHours {
  monday: BusinessHours;
  tuesday: BusinessHours;
  wednesday: BusinessHours;
  thursday: BusinessHours;
  friday: BusinessHours;
  saturday: BusinessHours;
  sunday: BusinessHours;
}

export interface DeliveryZone {
  name: string;
  fee: number;
}

export interface SocialMedia {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
}

export interface WhatsAppConfig {
  enabled: boolean;
  number: string;
  message_template: string;
  show_prices: boolean;
  greeting?: string;
  auto_include_restaurant_name: boolean;
}

export interface DisplayConfig {
  show_images: boolean;
  show_descriptions: boolean;
  show_categories: boolean;
  currency: string;
  currency_symbol: string;
  theme: 'light' | 'dark' | 'auto';
  colors: {
    primary: string;
    secondary: string;
  };
  language: string;
  show_availability_badge: boolean;
}

export interface OrderConfig {
  enabled: boolean;
  max_order_quantity: number;
  delivery_fee: number;
  payment_methods: string[];
  accepts_reservations: boolean;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
}

export interface BusinessConfig {
  business_hours: DayHours;
  timezone: string;
  delivery_zones: DeliveryZone[];
  social_media: SocialMedia;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface RestaurantConfig {
  name: string;
  slug: string;
  phone: string;
  address: string;
  location: Location;
}

export interface SettingsResponse {
  restaurant: RestaurantConfig;
  settings: {
    whatsapp_config: WhatsAppConfig;
    business_config: BusinessConfig;
    order_config: OrderConfig;
    display_config?: DisplayConfig;
    description?: string;
    tags?: string[];
    logo_url?: string | null;
  };
}

export interface BusinessSettings {
  restaurant_id: string;
  restaurant_config?: RestaurantConfig;
  whatsapp_config: WhatsAppConfig;
  display_config: DisplayConfig;
  order_config: OrderConfig;
  business_config: BusinessConfig;
  description?: string;
  tags?: string[];
  logo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Banner {
  id: string;
  image_url: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BannerCreate {
  image_base64: string;
  description?: string;
  display_order: number;
}

export interface BannerUpdate {
  description?: string;
  display_order?: number;
  is_active?: boolean;
}
