export type InterestStatus = 'pending' | 'contacted' | 'rejected';

export interface PropertyInterest {
  id: string;
  property_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  status: InterestStatus;
  notes?: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  property?: {
    id: string;
    title: string;
    address: string;
    price: number;
  };
}

export interface InterestWithDetails extends PropertyInterest {
  user: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    role: string;
  };
  property: {
    id: string;
    title: string;
    address: string;
    price: number;
    status: string;
    image_url?: string;
    property_images?: Array<{
      id: string;
      url: string;
      alt_text?: string;
      is_primary: boolean;
      sort_order: number;
    }>;
  };
}
