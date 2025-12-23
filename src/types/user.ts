export type UserRole = 'customer' | 'business' | 'rider';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
}

export interface Order {
  id: string;
  code: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  type: 'package' | 'food' | 'document';
  date: string;
  pickup: string;
  delivery: string;
  amount: number;
  customer?: string;
}

export interface Assignment {
  id: string;
  address: string;
  time: string;
  type: 'Pickup' | 'Delivery';
  status: 'upcoming' | 'next' | 'later' | 'completed';
  customerName?: string;
  phone?: string;
}
