import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import type {
  SalesOrder,
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  ApproveOrderDto,
  CancelOrderDto,
  ProcessPaymentDto,
  SalesOrderFilters,
  ApiResponse,
  PaginationParams,
} from "@/types";

// Query Keys
export const SALES_ORDER_KEYS = {
  all: ["sales-orders"] as const,
  lists: () => [...SALES_ORDER_KEYS.all, "list"] as const,
  list: (filters?: SalesOrderFilters) => [...SALES_ORDER_KEYS.lists(), filters] as const,
  details: () => [...SALES_ORDER_KEYS.all, "detail"] as const,
  detail: (id: number) => [...SALES_ORDER_KEYS.details(), id] as const,
  statistics: () => [...SALES_ORDER_KEYS.all, "statistics"] as const,
};

// Get all sales orders
export function useSalesOrders(filters?: SalesOrderFilters & PaginationParams) {
  return useQuery({
    queryKey: SALES_ORDER_KEYS.list(filters),
    queryFn: async () => {
      const response = await api.get<ApiResponse<SalesOrder[]>>("/sales-orders", { params: filters });
      return response;
    },
  });
}

// Get sales order by ID
export function useSalesOrder(id: number, enabled = true) {
  return useQuery({
    queryKey: SALES_ORDER_KEYS.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<SalesOrder>>(`/sales-orders/${id}`);
      return response;
    },
    enabled: enabled && !!id,
  });
}

// Create sales order
export function useCreateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSalesOrderDto) => {
      const response = await api.post<ApiResponse<SalesOrder>>("/sales-orders", data);
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: SALES_ORDER_KEYS.lists() });
      toast.success("Tạo đơn hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error.message || "Không thể tạo đơn hàng");
    },
  });
}

// Update sales order
export function useUpdateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateSalesOrderDto }) => {
      const response = await api.put<ApiResponse<SalesOrder>>(`/sales-orders/${id}`, data);
      return response;
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: SALES_ORDER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SALES_ORDER_KEYS.detail(variables.id) });
      toast.success("Cập nhật đơn hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Không thể cập nhật đơn hàng");
    },
  });
}

// Approve sales order
export function useApproveSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: ApproveOrderDto }) => {
      const response = await api.put<ApiResponse<SalesOrder>>(`/sales-orders/${id}/approve`, data);
      return response;
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: SALES_ORDER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SALES_ORDER_KEYS.detail(variables.id) });
      toast.success("Duyệt đơn hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Không thể duyệt đơn hàng");
    },
  });
}

// Complete sales order
export function useCompleteSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.put<ApiResponse<SalesOrder>>(`/sales-orders/${id}/complete`);
      return response;
    },
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: SALES_ORDER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SALES_ORDER_KEYS.detail(id) });
      toast.success("Hoàn thành đơn hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Không thể hoàn thành đơn hàng");
    },
  });
}

// Cancel sales order
export function useCancelSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CancelOrderDto }) => {
      const response = await api.put<ApiResponse<SalesOrder>>(`/sales-orders/${id}/cancel`, data);
      return response;
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: SALES_ORDER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SALES_ORDER_KEYS.detail(variables.id) });
      toast.success("Hủy đơn hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Không thể hủy đơn hàng");
    },
  });
}

// Process payment
export function useProcessPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProcessPaymentDto }) => {
      const response = await api.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/payment`, data);
      return response;
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: SALES_ORDER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SALES_ORDER_KEYS.detail(variables.id) });
      toast.success("Thanh toán thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Không thể xử lý thanh toán");
    },
  });
}

// Delete sales order
export function useDeleteSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/sales-orders/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALES_ORDER_KEYS.lists() });
      toast.success("Xóa đơn hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Không thể xóa đơn hàng");
    },
  });
}

// Refresh cache
export function useRefreshSalesOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<{ message: string }>>("/sales-orders/refresh");
      return response.data;
    },
    onSuccess: () => {
      // Invalidate tất cả sales order queries
      queryClient.invalidateQueries({ queryKey: SALES_ORDER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: SALES_ORDER_KEYS.statistics() });

      toast.success("Làm mới dữ liệu thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Làm mới dữ liệu thất bại!");
    },
  });
}
