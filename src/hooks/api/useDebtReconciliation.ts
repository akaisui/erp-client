import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios"; 
import type { ApiResponse } from "@/types/common.types";
import { toast } from "react-hot-toast"; 
import { useUsers } from "@/hooks/api/useUsers"; 

import type {
  DebtDetailDTO, 
  DebtReconciliationParams,
  SyncDebtPayload,
  SyncBatchDto,
  SendDebtNoticePayload,
  IntegrityResult,
  BackgroundJobResponse,
  IntegrityData,
  DebtListResponse,
  DebtType,
} from "@/types/debt-reconciliation.types"; 

const BASE_URL = "/smart-debt";

// =====================================================
// 0. QUERY KEYS
// =====================================================
export const debtKeys = {
  all: ["smart-debt"] as const,
  lists: () => [...debtKeys.all, "list"] as const,
  list: (filters: DebtReconciliationParams) => [...debtKeys.lists(), filters] as const,
  details: () => [...debtKeys.all, "detail"] as const,
  
  // ✅ Cập nhật Key: Phải có cả ID + TYPE + YEAR
  detail: (id: number, type: DebtType, year?: number) => 
    [...debtKeys.details(), id, type, year] as const,
    
  integrity: () => [...debtKeys.all, "integrity"] as const,
  provinces: () => ["customers", "provinces"] as const,
};

// =====================================================
// 1. QUERY HOOKS (LẤY DỮ LIỆU)
// =====================================================

// ✅ Hook Lấy Danh sách
export function useDebtReconciliations(filters: DebtReconciliationParams) {
  return useQuery({
    queryKey: debtKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<ApiResponse<DebtListResponse>>(
        BASE_URL,
        { params: filters }
      );
      console.log("Fetched debt reconciliations:", response.data);
      return response;
    },
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}

// Hook lấy danh sách in (Cập nhật thêm tham số type)
export const useExportDebtMutation = () => {
  return useMutation({
    mutationFn: async ({ year, type }: { year: number, type: 'all' | 'customer' | 'supplier' }) => {
      // Gọi API trực tiếp với tham số được truyền vào
      const res = await api.get(`/smart-debt/export-list`, {
        params: { year, type }
      });
      console.log(`Export data fetched for ${type}:`, res.data); // Debug log
      // Trả về mảng dữ liệu (Fallback về rỗng nếu null)
      return res.data?.data || (Array.isArray(res.data) ? res.data : []);
    }
  });
};

// ✅ Hook Lấy Chi tiết (ĐÃ SỬA CHUẨN)
export function useDebtReconciliation(id: number | null, type: DebtType, year?: number) {
  return useQuery({
    queryKey: debtKeys.detail(id!, type, year),
    queryFn: async () => {
      const response = await api.get<ApiResponse<DebtDetailDTO>>(
        `${BASE_URL}/${id}`,
        { params: { type, year } } // Truyền type & year lên API
      );
      return response.data;
    },
    enabled: !!id && !!type, // Chỉ chạy khi có đủ ID và Type
  });
}

// ✅ Hook Check Integrity
export function useCheckDataIntegrity(year?: number) {
    return useQuery<IntegrityData>({ 
        queryKey: [...debtKeys.integrity(), year],
        queryFn: async () => {
            const targetYear = year || new Date().getFullYear();
            const response = await api.get<ApiResponse<IntegrityResult>>( // Sửa kiểu trả về
                `/smart-debt/check-integrity`,
                { params: { year: targetYear } }
            );
            // API trả về: { success: true, data: { ... } }
            return (response.data as any)?.data || {
                year: targetYear,
                totalChecked: 0,
                discrepanciesCount: 0,
                discrepancies: []
            }; 
        },
        enabled: true,
        refetchOnWindowFocus: false,
    });
}

// =====================================================
// 2. HELPER HOOKS
// =====================================================

// ✅ Hook lấy danh sách Nhân viên
export function useDebtEmployees() {
  const { data: response, ...rest } = useUsers({ 
      status: 'active', 
      limit: 100        
  });
  
  // Logic trích xuất data an toàn (giữ nguyên logic của bạn vì nó đã tốt)
  let employees: any[] = [];
  if (Array.isArray(response)) {
      employees = response;
  } else if (response && Array.isArray((response as any).data)) {
      employees = (response as any).data;
  } else if (response && (response as any).data && Array.isArray((response as any).data.data)) {
      employees = (response as any).data.data;
  }

  const formattedEmployees = employees.map((u: any) => ({
      id: u.id,
      fullName: u.fullName || u.username || "Nhân viên",
      code: u.employeeCode
  }));

  return { data: formattedEmployees, ...rest };
}

// ✅ Hook lấy Tỉnh thành
export function useDebtProvinces() {
  return useQuery<string[]>({ 
    queryKey: debtKeys.provinces(),
    queryFn: async () => {
      try {
          const response = await api.get<ApiResponse<string[]>>("/customers/provinces");
          return response.data?.data || []; 
      } catch (error) {
          return []; 
      }
    },
    staleTime: 30 * 60 * 1000, // Cache 30 phút cho đỡ gọi nhiều
    initialData: [], 
  });
}

// =====================================================
// 3. MUTATION HOOKS (THAY ĐỔI DỮ LIỆU)
// =====================================================

// ✅ Sync Snapshot (Nhanh)
export function useSyncSnap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SyncDebtPayload) => {
      const response = await api.post<ApiResponse<any>>(`${BASE_URL}/sync-snap`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: debtKeys.lists() });
      queryClient.invalidateQueries({ queryKey: debtKeys.details() });
      toast.success("Đã cập nhật số liệu mới nhất!");
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Cập nhật thất bại!"),
  });
}

// ✅ Sync Full (Chậm - Chạy nền)
export function useSyncFull() {
  const queryClient = useQueryClient(); 
  return useMutation({
    mutationFn: async (payload: SyncDebtPayload) => {
      const response = await api.post<BackgroundJobResponse>(`${BASE_URL}/sync-full`, payload);
      return response.data;
    },
    onSuccess: async (data) => {
      // Thông báo chạy nền
      toast.success(data.message || "Đã gửi yêu cầu xử lý ngầm.");
      
      // Invalidates sau một khoảng thời gian (giả lập)
      setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: debtKeys.lists() });
          queryClient.invalidateQueries({ queryKey: debtKeys.details() });
      }, 3000);
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Lỗi gửi yêu cầu!"),
  });
}

// ✅ Batch Sync (Nút bấm trên Header)
export function useSyncSnapBatch() {
  return useMutation({
    mutationFn: async (payload: SyncBatchDto) => {
      const response = await api.post<BackgroundJobResponse>(`${BASE_URL}/sync-snap-batch`, payload);
      return response.data;
    },
    onSuccess: () => toast.success("Đã kích hoạt đồng bộ nhanh toàn hệ thống!"),
    onError: () => toast.error("Lỗi kích hoạt batch job."),
  });
}

export function useSyncFullBatch() {
  return useMutation({
    mutationFn: async (payload: SyncBatchDto) => {
      const response = await api.post<BackgroundJobResponse>(`${BASE_URL}/sync-full-batch`, payload);
      return response.data;
    },
    onSuccess: () => toast.success("Đã kích hoạt chế độ bảo trì hệ thống!"),
  });
}

// ✅ Gửi Email (ĐÃ CẬP NHẬT)
export function useSendReconciliationEmail() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SendDebtNoticePayload }) => {
      // URL: /api/smart-debt/:id/email
      // Body: { type: 'customer', year: 2025, message: '...' }
      const response = await api.post(`${BASE_URL}/${id}/email`, data);
      return response.data;
    },
    onSuccess: () => toast.success("Email đã được gửi đi!"),
    onError: (err: any) => toast.error(err?.response?.data?.message || "Gửi email thất bại!"),
  });
}

// ✅ Xuất PDF (ĐÃ CẬP NHẬT)
export function useExportReconciliationPDF() {
  return useMutation({
    mutationFn: async ({ id, type, year }: { id: number; type: DebtType; year?: number }) => {
      // URL: /api/smart-debt/:id/pdf?type=customer&year=2025
      const response = await api.get(`${BASE_URL}/${id}/pdf`, { 
          params: { type, year },
          responseType: "blob" // Quan trọng để nhận file binary
      });
      return response.data; // Trả về Blob
    },
    onSuccess: (data, variables) => {
      // Kiểm tra nếu là Blob hợp lệ (PDF)
      if (data && data.size > 0 && data.type === 'application/pdf') {
          const url = window.URL.createObjectURL(data);
          const link = document.createElement("a");
          link.href = url;
          // Tên file: cong-no-customer-123-2025.pdf
          link.setAttribute("download", `cong-no-${variables.type}-${variables.id}-${variables.year || 'hien-tai'}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          toast.success("Đã tải xuống PDF thành công!");
      } else {
          toast.error("File PDF bị lỗi hoặc không có dữ liệu.");
      }
    },
    onError: () => toast.error("Không thể tải file PDF."),
  });
}