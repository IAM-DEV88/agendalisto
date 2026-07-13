export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  appointment_id: string;
  business_id: string;
  user_id: string;
  status: ReviewStatus;
  before_image_url?: string | null;
  after_image_url?: string | null;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  likes_count: number;
  is_active: boolean;
  provider?: string;
  image_urls?: string[];
  min_cancellation_hours?: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role?: string;
  plan?: string;
  is_business?: boolean;
}

export interface Appointment {
  id: string;
  user_id: string;
  business_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  services?: Service;
  profiles?: Profile;
  review?: Review;
  notes?: string | null;
  guest_info?: GuestInfo | null;
  is_guest?: boolean;
  cancel_reason?: string | null;
  payment_status?: string | null;
  payment_provider?: string | null;
  payment_id?: string | null;
  payment_amount?: number | null;
  created_at: string;
  updated_at: string;
  businesses?: {
    name: string;
    address: string;
    slug?: string;
    logo_url?: string;
  };
}

export interface GuestInfo {
  name: string;
  email: string;
  phone: string;
}

export default Appointment;
