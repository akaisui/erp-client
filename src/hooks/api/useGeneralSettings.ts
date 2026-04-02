import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import type { ApiResponse } from '@/types';

interface BankAccount {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankBranch: string;
}

export interface GeneralSetting {
  id: number;
  brandName: string;
  logo?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxCode: string;
  website: string;
  banks: BankAccount[];
  updatedBy?: {
    id: number;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Query Keys
export const generalSettingKeys = {
  all: ['generalSettings'] as const,
  detail: () => [...generalSettingKeys.all, 'detail'] as const,
};

// Get General Settings
export function useGeneralSettings() {
  return useQuery({
    queryKey: generalSettingKeys.detail(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<GeneralSetting>>('/settings/general');
      return response;
    },
  });
}

// Update General Settings
export function useUpdateGeneralSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<GeneralSetting, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>) => {
      const response = await api.put<ApiResponse<GeneralSetting>>('/settings/general', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: generalSettingKeys.detail(),
        refetchType: 'active',
      });
      toast.success('Cập nhật cài đặt chung thành công!');
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || 'Cập nhật cài đặt thất bại!');
    },
  });
}
