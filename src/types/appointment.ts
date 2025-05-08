export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  appointment_id: string;
  business_id: string;
  user_id: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

export interface StatusHistory {
  status: AppointmentStatus;
  timestamp: string;
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
  status_history?: StatusHistory[];
  created_at: string;
  updated_at: string;
  businesses?: {
    name: string;
    address: string;
  };
}

export default Appointment; 