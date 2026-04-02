import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { StockTransaction, ApiResponse, PaginationParams, StockTransactionFilters } from "@/types";
import { toast } from "react-hot-toast";
import { type ExportFormData, type ImportFormData, type TransferFormData } from "@/lib/validations";

// Query Keys
export const stockTransactionKeys = {
  all: ["stock-transactions"] as const,
  lists: () => [...stockTransactionKeys.all, "list"] as const,
  list: (params?: any) => [...stockTransactionKeys.lists(), params] as const,
  details: () => [...stockTransactionKeys.all, "detail"] as const,
  detail: (id: number) => [...stockTransactionKeys.details(), id] as const,
};

// Get Stock Transactions List
export function useStockTransactions(params?: StockTransactionFilters & PaginationParams) {
  return useQuery({
    queryKey: stockTransactionKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<StockTransaction[]>>(
        "/stock-transactions",
        { params }
      );
      return response;
    },
  });
}

// Get Single Stock Transaction
export function useStockTransaction(id: number, enabled = true) {
  return useQuery({
    queryKey: stockTransactionKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<StockTransaction>>(
        `/stock-transactions/${id}`
      );
      return response;
    },
    enabled: enabled && !!id,
  });
}

// Create Import Transaction
export function useCreateImportTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ImportFormData) => {
      const response = await api.post<ApiResponse<StockTransaction>>(
        "/stock-transactions/import",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockTransactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Tạo phiếu nhập kho thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Tạo phiếu nhập kho thất bại!");
    },
  });
}

// Create Export Transaction
export function useCreateExportTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ExportFormData) => {
      const response = await api.post<ApiResponse<StockTransaction>>(
        "/stock-transactions/export",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockTransactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Tạo phiếu xuất kho thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Tạo phiếu xuất kho thất bại!");
    },
  });
}

// Create Transfer Transaction
export function useCreateTransferTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TransferFormData) => {
      const response = await api.post<ApiResponse<StockTransaction>>(
        "/stock-transactions/transfer",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockTransactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Tạo phiếu chuyển kho thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Tạo phiếu chuyển kho thất bại!");
    },
  });
}

// Create Disposal Transaction
export function useCreateDisposalTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      warehouseId: number;
      reason: string;
      notes?: string;
      details: Array<{
        productId: number;
        quantity: number;
        batchNumber?: string;
        notes?: string;
      }>;
    }) => {
      const response = await api.post<ApiResponse<StockTransaction>>(
        "/stock-transactions/disposal",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockTransactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Tạo phiếu xuất hủy thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Tạo phiếu xuất hủy thất bại!");
    },
  });
}

// Create Stocktake Transaction
export function useCreateStocktakeTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      warehouseId: number;
      reason?: string;
      notes?: string;
      details: Array<{
        productId: number;
        systemQuantity: number;
        actualQuantity: number;
        batchNumber?: string;
        notes?: string;
      }>;
    }) => {
      const response = await api.post<ApiResponse<StockTransaction>>(
        "/stock-transactions/stocktake",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockTransactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Tạo phiếu kiểm kê thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Tạo phiếu kiểm kê thất bại!");
    },
  });
}

// Approve Stock Transaction
export function useApproveTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const response = await api.put<ApiResponse<StockTransaction>>(
        `/stock-transactions/${id}/approve`,
        { notes }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: stockTransactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stockTransactionKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Phê duyệt phiếu thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Phê duyệt phiếu thất bại!");
    },
  });
}

// Cancel Stock Transaction
export function useCancelTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await api.put<ApiResponse<StockTransaction>>(
        `/stock-transactions/${id}/cancel`,
        { reason }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: stockTransactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stockTransactionKeys.detail(variables.id) });
      toast.success("Hủy phiếu thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Hủy phiếu thất bại!");
    },
  });
}
