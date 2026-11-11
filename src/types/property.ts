export type PropertyStatus = 'available' | 'on_sale' | 'sold';

export interface Property {
  id: string;
  /** Listing owner (profiles.id); used for CRM / webhooks */
  owner_id?: string | null;
  title: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: number;
  arv: number;
  roi: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  year_built: number;
  status: PropertyStatus;
  property_type: string;
  description: string;
  image_url: string;
  gallery: string[];
  property_images?: Array<{
    id: string;
    url: string;
    alt_text?: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  rehab_cost: number;
  monthly_rent: number;
  other_costs?: number;
  operating_expenses?: number;
  total_investment?: number;
  net_profit?: number;
  annual_income?: number;
  annual_noi?: number;
  cap_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  company?: string;
  avatar_url?: string;
}

export type UserRole = 'admin' | 'usuario' | 'pendiente' | 'investor' | 'agent';
