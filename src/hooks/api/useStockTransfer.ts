import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { ApiResponse, PaginationParams, StockTransferFilters } from "@/types";
import { toast } from "react-hot-toast";
import type { CreateStockTransferRequest, StockTransferDetail, StockTransferResponse } from "@/types";

// Query Keys
export const stockTransferKeys = {
  all: ["stock-transfers"] as const,
  lists: () => [...stockTransferKeys.all, "list"] as const,
  list: (params?: any) => [...stockTransferKeys.lists(), params] as const,
  details: () => [...stockTransferKeys.all, "detail"] as const,
  detail: (id: number) => [...stockTransferKeys.details(), id] as const,
};

// Get stock transfers list
export function useStockTransfers(params?: StockTransferFilters & PaginationParams) {
  return useQuery({
    queryKey: stockTransferKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<StockTransferDetail[]>>(
        "/stock-transfers",
        { params }
      );
      return response;
    },
  });
}

// Get stock transfer by ID
export function useStockTransfer(id: number, enabled = true) {
  return useQuery({
    queryKey: stockTransferKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<StockTransferDetail>>(
        `/stock-transfers/${id}`
      );
      return response;
    },
    enabled: enabled && !!id,
  });
}

// Approve transfer (Giai đoạn 2: in_transit)
export function useApproveStockTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const response = await api.put<ApiResponse<StockTransferDetail>>(
        `/stock-transfers/${id}/approve`,
        { notes }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: stockTransferKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: stockTransferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Duyệt phiếu thành công! Hàng đang vận chuyển (in_transit)");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Duyệt phiếu thất bại!");
    },
  });
}

// Complete transfer (Giai đoạn 3: completed)
export function useCompleteStockTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      notes,
      receivedDetails,
    }: {
      id: number;
      notes?: string;
      receivedDetails?: Array<{
        productId: number;
        receivedQuantity: number;
        notes?: string;
      }>;
    }) => {
      const response = await api.put<ApiResponse<StockTransferDetail>>(
        `/stock-transfers/${id}/complete`,
        { notes, receivedDetails }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: stockTransferKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: stockTransferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Nhận hàng thành công! Hàng đã cập nhật vào kho đích");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Nhận hàng thất bại!");
    },
  });
}

// Cancel transfer
export function useCancelStockTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await api.put<ApiResponse<StockTransferDetail>>(
        `/stock-transfers/${id}/cancel`,
        { reason }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: stockTransferKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: stockTransferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Hủy phiếu chuyển thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Hủy phiếu thất bại!");
    },
  });
}

// Create stock transfer
export function useCreateStockTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStockTransferRequest) => {
      const response = await api.post<ApiResponse<StockTransferResponse>>(
        "/stock-transfers",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockTransferKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Tạo phiếu chuyển kho thành công! (Trạng thái: Chờ duyệt)");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Tạo phiếu chuyển kho thất bại!");
    },
  });
}
