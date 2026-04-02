import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import type {
  CreateCustomerDto,
  UpdateCustomerDto,
  UpdateCreditLimitDto,
  UpdateCustomerStatusDto,
  CustomerFilters,
  PaginationParams,
  Customer,
  ApiResponse,
  CustomerCard,
} from "@/types";

// Query Keys
export const CUSTOMER_KEYS = {
  all: ["customers"] as const,
  lists: () => [...CUSTOMER_KEYS.all, "list"] as const,
  list: (filters?: CustomerFilters) => [...CUSTOMER_KEYS.lists(), filters] as const,
  details: () => [...CUSTOMER_KEYS.all, "detail"] as const,
  detail: (id: number) => [...CUSTOMER_KEYS.details(), id] as const,
  debt: (id: number) => [...CUSTOMER_KEYS.detail(id), "debt"] as const,
  orders: (id: number) => [...CUSTOMER_KEYS.detail(id), "orders"] as const,
  overdueDebt: () => [...CUSTOMER_KEYS.all, "overdue-debt"] as const,
};

// Get all customers
export function useCustomers(params?: CustomerFilters & PaginationParams) {
  return useQuery({
    queryKey: CUSTOMER_KEYS.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Customer[]> & { cards: CustomerCard }>("/customers", { 
        params 
      });
      return response as any as (ApiResponse<Customer[]> & { cards: CustomerCard });
    },
  });
}

// Get customer by ID
export function useCustomer(id: number, enabled = true) {
  return useQuery({
    queryKey: CUSTOMER_KEYS.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
      return response;
    },
    enabled: enabled && !!id,
  });
}

// Get customer debt info
export function useCustomerDebt(id: number, enabled = true) {
  return useQuery({
    queryKey: CUSTOMER_KEYS.debt(id),
    queryFn: async () => {
      const response = await api.get(`/customers/${id}/debt`);
      return response;
    },
    enabled: enabled && !!id,
  });
}

// Get customer order history
export function useCustomerOrders(id: number, page = 1, limit = 20, enabled = true) {
  return useQuery({
    queryKey: [...CUSTOMER_KEYS.orders(id), page, limit],
    queryFn: async () => {
      const response = await api.get(`/customers/${id}/orders`, {
        params: { page, limit },
      });
      return response;
    },
    enabled: enabled && !!id,
  });
}

// Get customers with overdue debt
export function useOverdueDebtCustomers() {
  return useQuery({
    queryKey: CUSTOMER_KEYS.overdueDebt(),
    queryFn: async () => {
      const response = await api.get("/customers/overdue-debt");
      return response;
    },
  });
}

// Create customer
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerDto) => {
      const response = await api.post<ApiResponse<Customer>>("/customers", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      toast.success("Tạo khách hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error.message || "Không thể tạo khách hàng");
    },
  });
}

// Update customer
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCustomerDto }) => {
      const response = await api.put(`/customers/${id}`, data);
      return response;
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.detail(variables.id) });
      toast.success("Cập nhật khách hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Không thể cập nhật khách hàng");
    },
  });
}

// Update customer credit limit
export function useUpdateCreditLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCreditLimitDto }) => {
      const response = await api.put(`/customers/${id}/credit-limit`, data);
      return response;
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.debt(variables.id) });
      toast.success("Cập nhật hạn mức công nợ thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Không thể cập nhật hạn mức công nợ");
    },
  });
}

// Update customer status
export function useUpdateCustomerStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCustomerStatusDto }) => {
      const response = await api.patch(`/customers/${id}/status`, data);
      return response;
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.detail(variables.id) });
      toast.success("Cập nhật trạng thái khách hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Không thể cập nhật trạng thái");
    },
  });
}

// Delete customer
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/customers/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      toast.success("Xóa khách hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Không thể xóa khách hàng");
    },
  });
}

// Bulk delete customers
export function useBulkDeleteCustomers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: number[]) => {
      const deletePromises = ids.map((id) => api.delete(`/customers/${id}`));
      await Promise.all(deletePromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMER_KEYS.lists() });
      toast.success("Xóa khách hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Không thể xóa khách hàng");
    },
  });
}
