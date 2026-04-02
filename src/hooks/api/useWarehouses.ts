import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Warehouse, WarehouseStatistics, ApiResponse, PaginationParams, WarehouseFilters, WarehouseCards } from "@/types";
import { toast } from "react-hot-toast";
import { UpdateWarehouseFormData, WarehouseFormData } from "@/lib/validations";

// Query Keys
export const warehouseKeys = {
  all: ["warehouses"] as const,
  lists: () => [...warehouseKeys.all, "list"] as const,
  list: (params?: PaginationParams) => [...warehouseKeys.lists(), params] as const,
  details: () => [...warehouseKeys.all, "detail"] as const,
  detail: (id: number) => [...warehouseKeys.details(), id] as const,
  statistics: (id: number) => [...warehouseKeys.all, "statistics", id] as const,
};

// Get Warehouses List
export function useWarehouses(params?: PaginationParams & WarehouseFilters) {
  return useQuery({
    queryKey: warehouseKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Warehouse[]>  & { cards: WarehouseCards }>("/warehouses", {
        params,
      });
      return response;
    },
  });
}

// Get Single Warehouse
export function useWarehouse(id: number, enabled = true) {
  return useQuery({
    queryKey: warehouseKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Warehouse>>(`/warehouses/${id}`);
      return response;
    },
    enabled: enabled && !!id,
  });
}

// Create Warehouse
export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<WarehouseFormData>) => {
      const response = await api.post<ApiResponse<Warehouse>>("/warehouses", data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate và refetch ngay lập tức
      queryClient.invalidateQueries({
        queryKey: warehouseKeys.lists(),
        refetchType: 'active',
      });
      toast.success("Tạo kho thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Tạo kho thất bại!");
    },
  });
}

// Update Warehouse
export function useUpdateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<UpdateWarehouseFormData> }) => {
      const response = await api.put<ApiResponse<Warehouse>>(`/warehouses/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate và refetch ngay lập tức
      queryClient.invalidateQueries({
        queryKey: warehouseKeys.lists(),
        refetchType: 'active',
      });
      queryClient.invalidateQueries({
        queryKey: warehouseKeys.detail(variables.id),
        refetchType: 'active',
      });
      toast.success("Cập nhật kho thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Cập nhật kho thất bại!");
    },
  });
}

// Delete Warehouse
export function useDeleteWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<void>>(`/warehouses/${id}`);
      return response;
    },
    onSuccess: () => {
      // Invalidate và refetch ngay lập tức
      queryClient.invalidateQueries({
        queryKey: warehouseKeys.lists(),
        refetchType: 'active', 
      });
      toast.success("Xóa kho thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Xóa kho thất bại!");
    },
  });
}

// Get Warehouse Statistics
export function useWarehouseStatistics(id: number, enabled = true) {
  return useQuery({
    queryKey: warehouseKeys.statistics(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<WarehouseStatistics>>(`/warehouses/${id}/statistics`);
      return response;
    },
    enabled: enabled && !!id,
  });
}

