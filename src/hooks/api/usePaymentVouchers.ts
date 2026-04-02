import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type {
  ApiResponse,
  PaginationParams,
  PaginationMeta,
} from "@/types/common.types";
import type {
  PaymentVoucher,
  UpdatePaymentVoucherDto,
  ApproveVoucherDto,
  PaymentVoucherFilters,
  PaymentVoucherStatistics,
} from "@/types/finance.types";
import { toast } from "react-hot-toast";
import { PaymentVoucherFormData } from "@/lib/validations";

// =====================================================
// QUERY KEYS
// =====================================================
export const paymentVoucherKeys = {
  all: ["payment-vouchers"] as const,
  lists: () => [...paymentVoucherKeys.all, "list"] as const,
  list: (filters?: PaymentVoucherFilters & PaginationParams) =>
    [...paymentVoucherKeys.lists(), filters] as const,
  details: () => [...paymentVoucherKeys.all, "detail"] as const,
  detail: (id: number) => [...paymentVoucherKeys.details(), id] as const,
  statistics: (filters?: PaymentVoucherFilters) =>
    [...paymentVoucherKeys.all, "statistics", filters] as const,
};

// =====================================================
// QUERY HOOKS
// =====================================================
// Get payment vouchers list with filters
export function usePaymentVouchers(
  filters?: PaymentVoucherFilters & PaginationParams
) {
  return useQuery({
    queryKey: paymentVoucherKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<
        ApiResponse<PaymentVoucher[]>
      >("/payment-vouchers", {
        params: filters,
      });
      return response;
    },
  });
}

// Get single payment voucher by ID
export function usePaymentVoucher(id: number) {
  return useQuery({
    queryKey: paymentVoucherKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaymentVoucher>>(
        `/payment-vouchers/${id}`
      );
      return response;
    },
    enabled: !!id,
  });
}

// Get supplier payment vouchers
export function useSupplierPaymentVouchers(
  supplierId: number,
  filters?: PaginationParams
) {
  return useQuery({
    queryKey: paymentVoucherKeys.list({
      voucherType: "supplier_payment",
      supplierId,
      ...filters,
    }),
    queryFn: async () => {
      const response = await api.get<
        ApiResponse<{ vouchers: PaymentVoucher[]; meta: PaginationMeta }>
      >("/payment-vouchers", {
        params: {
          voucherType: "supplier_payment",
          supplierId,
          ...filters,
        },
      });
      return response.data;
    },
    enabled: !!supplierId,
  });
}

// =====================================================
// MUTATION HOOKS
// =====================================================
// Create new payment voucher
export function useCreatePaymentVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PaymentVoucherFormData) => {
      const response = await api.post<ApiResponse<PaymentVoucher>>(
        "/payment-vouchers",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: paymentVoucherKeys.statistics(),
      });
      toast.success("Tạo phiếu chi thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.error?.message || "Tạo phiếu chi thất bại!"
      );
    },
  });
}

// Update payment voucher
export function useUpdatePaymentVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdatePaymentVoucherDto;
    }) => {
      const response = await api.put<ApiResponse<PaymentVoucher>>(
        `/payment-vouchers/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: paymentVoucherKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: paymentVoucherKeys.statistics(),
      });
      toast.success("Cập nhật phiếu chi thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.error?.message || "Cập nhật phiếu chi thất bại!"
      );
    },
  });
}

// Approve payment voucher
export function useApprovePaymentVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data?: ApproveVoucherDto;
    }) => {
      const response = await api.put<ApiResponse<PaymentVoucher>>(
        `/payment-vouchers/${id}/approve`,
        data || {}
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: paymentVoucherKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: paymentVoucherKeys.statistics(),
      });

      // IMPORTANT: Invalidate supplier queries (debt updated)
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });

      toast.success("Phê duyệt phiếu chi thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.error?.message || "Phê duyệt phiếu chi thất bại!"
      );
    },
  });
}

// Post (Record) payment voucher - Update cash fund and debts
// CRITICAL: This will update cash fund and supplier/salary data
export function usePostPaymentVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data?: { notes?: string };
    }) => {
      const response = await api.post<ApiResponse<PaymentVoucher>>(
        `/payment-vouchers/${id}/post`,
        data || {}
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: paymentVoucherKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: paymentVoucherKeys.statistics(),
      });

      // IMPORTANT: Invalidate dependent queries (cash fund, supplier debt, salary)
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["cash-fund"] });
      queryClient.invalidateQueries({ queryKey: ["salary"] });

      toast.success("Ghi sổ phiếu chi thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.error?.message || "Ghi sổ phiếu chi thất bại!"
      );
    },
  });
}

// Unpost (Revert) payment voucher - Revert posted status
export function useUnpostPaymentVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<PaymentVoucher>>(
        `/payment-vouchers/${id}/unpost`
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: paymentVoucherKeys.detail(variables),
      });
      queryClient.invalidateQueries({
        queryKey: paymentVoucherKeys.statistics(),
      });

      // IMPORTANT: Invalidate dependent queries
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["cash-fund"] });
      queryClient.invalidateQueries({ queryKey: ["salary"] });

      toast.success("Bỏ ghi sổ phiếu chi thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.error?.message || "Bỏ ghi sổ phiếu chi thất bại!"
      );
    },
  });
}

// Delete payment voucher (only if not approved)
export function useDeletePaymentVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<void>>(
        `/payment-vouchers/${id}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: paymentVoucherKeys.statistics(),
      });
      toast.success("Xóa phiếu chi thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.error?.message || "Xóa phiếu chi thất bại!"
      );
    },
  });
}

// Bulk delete payment vouchers
export function useBulkDeletePaymentVouchers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await api.post<ApiResponse<void>>(
        "/payment-vouchers/bulk-delete",
        { ids }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: paymentVoucherKeys.statistics(),
      });
      toast.success("Xóa phiếu chi thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.error?.message || "Xóa phiếu chi thất bại!"
      );
    },
  });
}

// Bulk post payment vouchers
export function useBulkPostPaymentVouchers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: number[]) => {
      const response = await api.post<ApiResponse<void>>(
        "/payment-vouchers/bulk-post",
        { ids }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: paymentVoucherKeys.statistics(),
      });

      // IMPORTANT: Invalidate dependent queries
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["cash-fund"] });
      queryClient.invalidateQueries({ queryKey: ["salary"] });

      toast.success("Ghi sổ phiếu chi thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.error?.message || "Ghi sổ phiếu chi thất bại!"
      );
    },
  });
}

// Refresh cache
export function useRefreshPaymentVouchers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<{ message: string }>>(
        "/payment-vouchers/refresh"
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate tất cả payment voucher queries
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentVoucherKeys.statistics() });
      
      toast.success("Làm mới dữ liệu thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.error?.message || "Làm mới dữ liệu thất bại!"
      );
    },
  });
}