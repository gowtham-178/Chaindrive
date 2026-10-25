import client from './client';
import { AuditLogItem, DashboardStats, ApiResponse, PaginatedResponse } from '../types';

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await client.get<ApiResponse<DashboardStats>>('/api/audit/stats');
  return res.data.data;
}

export async function getAuditLogs(params?: {
  targetType?: string;
  page?: number;
}): Promise<PaginatedResponse<AuditLogItem>> {
  const res = await client.get<PaginatedResponse<AuditLogItem>>('/api/audit/logs', { params });
  return res.data;
}
