import client from './client';
import { License, ApiResponse, PaginatedResponse } from '../types';

export interface ApplyLicenseInput {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  vehicleClasses: string[];
  applicationNotes?: string;
}

export async function applyLicense(data: ApplyLicenseInput): Promise<License> {
  const res = await client.post<ApiResponse<License>>('/api/licenses/apply', data);
  return res.data.data;
}

export async function getMyLicense(): Promise<License | null> {
  const res = await client.get<ApiResponse<License | null>>('/api/licenses/me');
  return res.data.data;
}

export async function getApplications(status?: string, page = 1): Promise<PaginatedResponse<License>> {
  const res = await client.get<PaginatedResponse<License>>('/api/licenses/applications', {
    params: { status, page },
  });
  return res.data;
}

export async function reviewApplication(
  id: string,
  decision: 'approved' | 'rejected',
  reason?: string
): Promise<License> {
  const res = await client.patch<ApiResponse<License>>(`/api/licenses/applications/${id}/review`, {
    decision,
    reason,
  });
  return res.data.data;
}

export async function issueLicense(id: string): Promise<License> {
  const res = await client.post<ApiResponse<License>>(`/api/licenses/applications/${id}/issue`);
  return res.data.data;
}

export async function suspendLicense(id: string, reason: string): Promise<License> {
  const res = await client.patch<ApiResponse<License>>(`/api/licenses/${id}/suspend`, { reason });
  return res.data.data;
}

export async function revokeLicense(id: string, reason: string): Promise<License> {
  const res = await client.patch<ApiResponse<License>>(`/api/licenses/${id}/revoke`, { reason });
  return res.data.data;
}

export async function getLicenseByNumber(licenseNumber: string): Promise<License> {
  const res = await client.get<ApiResponse<License>>(`/api/licenses/${licenseNumber}`);
  return res.data.data;
}

export async function verifyLicensePublic(licenseNumber: string): Promise<{
  isValid: boolean;
  licenseNumber: string;
  fullName: string;
  vehicleClasses: string[];
  status: string;
  issuedAt?: string;
  expiresAt?: string;
  isIntegrityVerified: boolean;
  onChainHash?: string;
}> {
  const res = await client.get<ApiResponse<{
    isValid: boolean;
    licenseNumber: string;
    fullName: string;
    vehicleClasses: string[];
    status: string;
    issuedAt?: string;
    expiresAt?: string;
    isIntegrityVerified: boolean;
    onChainHash?: string;
  }>>(`/api/licenses/verify/${licenseNumber}`);
  return res.data.data;
}
