import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type {
  PaymentReceipt,
  UpdatePaymentReceiptDto,
  ApproveReceiptDto,
  PaymentReceiptFilters,
  ApiResponse,
  PaginationParams,
} from "@/types";
import { toast } from "react-hot-toast";
import { type PaymentReceiptFormData } from "@/lib/validations";

// Query Keys
export const paymentReceiptKeys = {
  all: ["payment-receipts"] as const,
  lists: () => [...paymentReceiptKeys.all, "list"] as const,
  list: (filters?: PaymentReceiptFilters & PaginationParams) =>
    [...paymentReceiptKeys.lists(), filters] as const,
  details: () => [...paymentReceiptKeys.all, "detail"] as const,
  detail: (id: number) => [...paymentReceiptKeys.details(), id] as const,
  statistics: () => [...paymentReceiptKeys.all, "statistics"] as const,
};

// Get Payment Receipts List với filters & pagination
export function usePaymentReceipts(params?: PaymentReceiptFilters & PaginationParams) {
  return useQuery({
    queryKey: paymentReceiptKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaymentReceipt[]>>(
        "/payment-receipts",
        { params }
      );
      console.log(response);
      return response;
    },
  });
}

// Get Single Payment Receipt by ID
export function usePaymentReceipt(id: number, enabled = true) {
  return useQuery({
    queryKey: paymentReceiptKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaymentReceipt>>(
        `/payment-receipts/${id}`
      );
      return response;
    },
    enabled: enabled && !!id,
  });
}

// Create Payment Receipt Mutation
export function useCreatePaymentReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PaymentReceiptFormData) => {
      const response = await api.post<ApiResponse<PaymentReceipt>>(
        "/payment-receipts",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentReceiptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentReceiptKeys.statistics() });
      toast.success("Tạo phiếu thu thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Tạo phiếu thu thất bại!");
    },
  });
}

// Update Payment Receipt Mutation
export function useUpdatePaymentReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdatePaymentReceiptDto;
    }) => {
      const response = await api.put<ApiResponse<PaymentReceipt>>(
        `/payment-receipts/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentReceiptKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: paymentReceiptKeys.detail(variables.id),
      });
      toast.success("Cập nhật phiếu thu thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Cập nhật phiếu thu thất bại!");
    },
  });
}

// Approve Payment Receipt Mutation
// IMPORTANT: Tự động update customer debt và order paid_amount
export function useApprovePaymentReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: ApproveReceiptDto }) => {
      const response = await api.put<ApiResponse<PaymentReceipt>>(
        `/payment-receipts/${id}/approve`,
        data || {}
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentReceiptKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: paymentReceiptKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: paymentReceiptKeys.statistics() });

      // Invalidate customer queries (debt updated)
      queryClient.invalidateQueries({ queryKey: ["customers"] });

      // Invalidate order queries (paid_amount updated)
      if (data.orderId) {
        queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      }

      toast.success("Phê duyệt phiếu thu thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Phê duyệt phiếu thu thất bại!");
    },
  });
}

// Post Payment Receipt Mutation (Ghi sổ)
// IMPORTANT: Tự động update cash fund
export function usePostPaymentReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data?: { notes?: string };
    }) => {
      const response = await api.post<ApiResponse<PaymentReceipt>>(
        `/payment-receipts/${id}/post`,
        data || {}
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentReceiptKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: paymentReceiptKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: paymentReceiptKeys.statistics() });

      // Invalidate cash fund queries
      queryClient.invalidateQueries({ queryKey: ["cash-fund"] });

      toast.success("Ghi sổ phiếu thu thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Ghi sổ phiếu thu thất bại!");
    },
  });
}

// Delete Payment Receipt Mutation
export function useDeletePaymentReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<void>>(`/payment-receipts/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentReceiptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentReceiptKeys.statistics() });
      toast.success("Xóa phiếu thu thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Xóa phiếu thu thất bại!");
    },
  });
}

// Send Email Payment Receipt Mutation
export function useSendEmailPaymentReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      const response = await api.post<ApiResponse<PaymentReceipt>>(
        `/payment-receipts/${id}/send-email`,
        {}
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentReceiptKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: paymentReceiptKeys.detail(variables.id),
      });
      toast.success("Gửi biên lai điện tử thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Gửi biên lai điện tử thất bại!");
    },
  });
}

// Bulk Delete Payment Receipts
export function useBulkDeletePaymentReceipts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: number[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => api.delete<ApiResponse<void>>(`/payment-receipts/${id}`))
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return { successful, failed, total: ids.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: paymentReceiptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentReceiptKeys.statistics() });

      if (result.failed === 0) {
        toast.success(`Đã xóa ${result.successful} phiếu thu thành công!`);
      } else {
        toast.success(
          `Đã xóa ${result.successful}/${result.total} phiếu thu. ${result.failed} phiếu thất bại.`
        );
      }
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Xóa phiếu thu thất bại!");
    },
  });
}

// Refresh cache
export function useRefreshPaymentReceipts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<{ message: string }>>(
        "/payment-receipts/refresh"
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentReceiptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentReceiptKeys.statistics() });
      
      toast.success("Làm mới dữ liệu thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.error?.message || "Làm mới dữ liệu thất bại!"
      );
    },
  });
}
