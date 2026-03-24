export type UserRole = 'sysadmin' | 'account_admin' | 'account_user' | 'account_observer';

export interface Profile {
  id: string;
  email: string;
  username?: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  account_id?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  settings: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}