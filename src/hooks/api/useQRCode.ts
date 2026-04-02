import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';

// Types
export interface GenerateQRInput {
  startDate: string;
  endDate: string;
  shift?: 'morning' | 'afternoon' | 'all_day';
  type?: 'check_in' | 'check_out';
}

export interface ScanQRInput {
  qrData: string;
  location?: string;
}

export interface QRCode {
  id: number;
  qrCode: string;
  sessionToken: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageCount: number;
  createdBy: number;
  createdAt: string;
  expiresAt: string;
  creator?: {
    id: number;
    fullName: string;
    employeeCode: string;
  };
  token?: string;
}

// Generate QR Code
export function useGenerateQR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GenerateQRInput) => {
      const response = await api.post('/attendance/qr/generate', data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
      toast.success('Tạo QR code thành công');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Không thể tạo QR code');
    },
  });
}

// Scan QR Code
export function useScanQR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ScanQRInput) => {
      const response = await api.post('/attendance/qr/scan', data);
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      toast.success(response.data.message || 'Chấm công thành công');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Không thể chấm công');
    },
  });
}

// Get all QR codes
export function useQRCodes(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['qr-codes', params],
    queryFn: async () => {
      const response = await api.get('/attendance/qr', { params });
      return response;
    },
  });
}

// Get QR code by ID
export function useQRCode(id: number) {
  return useQuery({
    queryKey: ['qr-code', id],
    queryFn: async () => {
      const response = await api.get(`/attendance/qr/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

// Deactivate QR code
export function useDeactivateQR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.put(`/attendance/qr/${id}/deactivate`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
      toast.success('Đã vô hiệu hóa QR code');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Không thể vô hiệu hóa QR code');
    },
  });
}

// Delete QR code
export function useDeleteQR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/attendance/qr/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
      toast.success('Đã xóa QR code');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Không thể xóa QR code');
    },
  });
}
