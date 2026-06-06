import client from './client';
import type { LoginRequest, RegisterRequest, LoginResponse, UpdateProfileRequest, ChangePasswordRequest } from '../types/user';
import type { User, Address } from '../types/user';

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const res = await client.post('/api/v1/auth/login', {
    username: data.username,
    password: data.password,
  });
  return res.data;
};

export const register = async (data: RegisterRequest): Promise<User> => {
  const res = await client.post('/api/v1/auth/register', data);
  return res.data;
};

export const getMe = async (): Promise<User> => {
  const res = await client.get('/api/v1/auth/me');
  return res.data;
};

export const updateMe = async (data: UpdateProfileRequest): Promise<User> => {
  const res = await client.put('/api/v1/auth/me', data);
  return res.data;
};

export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
  await client.put('/api/auth/change-password', data);
};

export const getAddresses = async (): Promise<Address[]> => {
  const res = await client.get('/api/auth/addresses');
  return res.data;
};

export const createAddress = async (data: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Address> => {
  const res = await client.post('/api/auth/addresses', data);
  return res.data;
};

export const updateAddress = async (id: number, data: Partial<Address>): Promise<Address> => {
  const res = await client.put(`/api/auth/addresses/${id}`, data);
  return res.data;
};

export const deleteAddress = async (id: number): Promise<void> => {
  await client.delete(`/api/auth/addresses/${id}`);
};
