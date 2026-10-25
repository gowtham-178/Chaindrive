import client from '../lib/client';
import { User, ApiResponse } from '../types';

export interface RegisterInput {
  email: string;
  password: string;
  role?: 'admin' | 'officer' | 'driver';
  fullName: string;
  phone: string;
  dateOfBirth?: string;
  address?: { street: string; city: string; state: string; pincode: string };
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function registerUser(data: RegisterInput): Promise<ApiResponse<{ user: User }>> {
  const res = await client.post('/api/auth/register', data);
  return res.data;
}

export async function loginUser(data: LoginInput): Promise<ApiResponse<{ user: User }>> {
  const res = await client.post('/api/auth/login', data);
  return res.data;
}

export async function logoutUser(): Promise<void> {
  await client.post('/api/auth/logout');
}

export async function getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
  const res = await client.get('/api/auth/me');
  return res.data;
}

export async function updateWalletAddress(walletAddress: string): Promise<ApiResponse<{ user: User }>> {
  const res = await client.patch('/api/auth/wallet', { walletAddress });
  return res.data;
}
