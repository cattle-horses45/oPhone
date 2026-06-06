export interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  full_name?: string;
  avatar_url?: string;
  avatar?: string;
  role: 'user' | 'admin';
  is_active: boolean;
  addresses?: Address[];
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: number;
  user_id: number;
  receiver_name: string;
  receiver_phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  phone?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UpdateProfileRequest {
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}
