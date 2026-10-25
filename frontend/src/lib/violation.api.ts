import client from './client';
import { Violation, Dispute, Payment, ApiResponse, PaginatedResponse } from '../types';

export interface RecordViolationInput {
  licenseNumber: string;
  vehiclePlate: string;
  violationType: string;
  description: string;
  location: string;
  fineAmountInr: number;
  occurredAt?: string;
  evidenceUrl?: string;
}

export async function recordViolation(data: RecordViolationInput): Promise<Violation> {
  const res = await client.post<ApiResponse<Violation>>('/api/violations', data);
  return res.data.data;
}

export async function getViolations(params?: {
  status?: string;
  licenseNumber?: string;
  mine?: boolean;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<Violation>> {
  const res = await client.get<PaginatedResponse<Violation>>('/api/violations', { params });
  return res.data;
}

export async function getViolationById(id: string): Promise<Violation> {
  const res = await client.get<ApiResponse<Violation>>(`/api/violations/${id}`);
  return res.data.data;
}

export async function payViolation(
  id: string,
  data: { payerAddress: string; txHash: string; blockNumber?: number }
): Promise<Payment> {
  const res = await client.post<ApiResponse<Payment>>(`/api/violations/${id}/pay`, data);
  return res.data.data;
}

export async function disputeViolation(
  id: string,
  data: { reason: string; evidenceUrl?: string }
): Promise<Dispute> {
  const res = await client.post<ApiResponse<Dispute>>(`/api/violations/${id}/dispute`, data);
  return res.data.data;
}

export async function getDisputes(status?: string): Promise<Dispute[]> {
  const res = await client.get<ApiResponse<Dispute[]>>('/api/violations/disputes', {
    params: { status },
  });
  return res.data.data;
}

export async function resolveDispute(
  disputeId: string,
  data: { decision: 'accepted' | 'rejected'; notes?: string }
): Promise<Dispute> {
  const res = await client.patch<ApiResponse<Dispute>>(
    `/api/violations/disputes/${disputeId}/resolve`,
    data
  );
  return res.data.data;
}

export async function verifyViolationIntegrity(id: string): Promise<boolean> {
  const res = await client.get<ApiResponse<{ isValid: boolean }>>(
    `/api/violations/${id}/verify-integrity`
  );
  return res.data.data.isValid;
}
