import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import type { ApiResponse } from '@/types';

export interface LoginLog {
  id: number;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  logoutAt?: string | null;
}

export interface LoginStats {
  totalLogins: number;
  activeSessions: number;
  lastLogin?: string;
}

// Query Keys
export const loginHistoryKeys = {
  all: ['loginHistory'] as const,
  list: () => [...loginHistoryKeys.all, 'list'] as const,
  stats: () => [...loginHistoryKeys.all, 'stats'] as const,
};

// Get Login History
export function useLoginHistory(limit = 50) {
  return useQuery({
    queryKey: loginHistoryKeys.list(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<LoginLog[]>>('/settings/login-history', {
        params: { limit },
      });
      return response.data;
    },
  });
}

// Get Login Statistics
export function useLoginStats() {
  return useQuery({
    queryKey: loginHistoryKeys.stats(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<LoginStats>>('/settings/login-history/stats');
      return response.data;
    },
  });
}

// Revoke Login Sessions
export function useRevokeLoginSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logIds: number[]) => {
      const response = await api.post<ApiResponse<{ revokedCount: number }>>(
        '/settings/login-history/revoke',
        { logIds }
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: loginHistoryKeys.list(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: loginHistoryKeys.stats(),
        refetchType: 'active',
      });
      toast.success(`Đã đăng xuất ${(data as any).revokedCount} phiên!`);
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Đăng xuất phiên thất bại!');
    },
  });
}
