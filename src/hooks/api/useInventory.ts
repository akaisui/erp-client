import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type {
  Inventory,
  InventoryByProductResponse,
  InventoryFilters,
  AlertsApiResponse,
  ApiResponse,
  PaginationParams,
  CardStat,
  AlertFilters,
  InventoryByWarehouseResponse,
} from "@/types";
import { toast } from "react-hot-toast";

export const inventoryKeys = {
  all: ["inventory"] as const,
  lists: () => [...inventoryKeys.all, "list"] as const,
  list: (filters?: InventoryFilters & PaginationParams) =>
    [...inventoryKeys.lists(), filters] as const,
  listAlerts: () => [...inventoryKeys.all, "alerts"] as const,
  listAlert: (filters?: AlertFilters & PaginationParams) => 
    [...inventoryKeys.listAlerts(), filters] as const,
  transactions: () => [...inventoryKeys.all, "transactions"] as const,
  transaction: (id: number) => [...inventoryKeys.transactions(), id] as const,
  lowStock: () => [...inventoryKeys.all, "low-stock"] as const,
};

// Get Inventory List
export function useInventory(params?: InventoryFilters & PaginationParams) {
  return useQuery({
    queryKey: inventoryKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Inventory[]> & { cards: CardStat }>("/inventory", {
        params,
      });
      return response;
    },
  });
}

// Get Inventory by Warehouse
export function useInventoryByWarehouse(warehouseId: number, enabled = true) {
  return useQuery({
    queryKey: [...inventoryKeys.all, "warehouse", warehouseId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<InventoryByWarehouseResponse[]>>(
        `/inventory/warehouse/${warehouseId}`
      );
      return response;
    },
    enabled: enabled && !!warehouseId,
  });
}

// Get Inventory by Product (across all warehouses)
export function useInventoryByProduct(productId: number, enabled = true) {
  return useQuery({
    queryKey: [...inventoryKeys.all, "product", productId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<InventoryByProductResponse>>(
        `/inventory/product/${productId}`
      );
      return response;
    },
    enabled: enabled && !!productId,
  });
}

// Get Cảnh Báo Tồn Kho (Tồn Thấp)
export function useInventoryAlerts(params?: AlertFilters & PaginationParams) {
  return useQuery({
    queryKey: inventoryKeys.listAlert(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<AlertsApiResponse>>(
        "/inventory/alerts",
        { params }
      );
      return response;
    },
    refetchInterval: 60000, // Refetch mỗi 1 phút
  });
}

// Get Inventory Value Report
export function useInventoryValueReport(warehouseId?: number) {
  return useQuery({
    queryKey: [...inventoryKeys.all, "value-report", warehouseId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(
        "/inventory/value-report",
        { params: { warehouseId } }
      );
      return response;
    },
  });
}

// Check Inventory Availability
export function useCheckInventoryAvailability() {
  return useMutation({
    mutationFn: async (items: Array<{ warehouseId: number; productId: number; quantity: number }>) => {
      const response = await api.post<ApiResponse<any>>(
        "/inventory/check",
        { items }
      );
      return response.data;
    },
  });
}

// Update Inventory (Manual update - Admin only)
export function useUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { warehouseId: number; productId: number; quantity: number; reservedQuantity?: number }) => {
      const response = await api.put<ApiResponse<Inventory>>(
        "/inventory/update",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      toast.success("Cập nhật tồn kho thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Cập nhật tồn kho thất bại!");
    },
  });
}

// Adjust Inventory (Increase/Decrease)
export function useAdjustInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { warehouseId: number; productId: number; quantityChange: number; reason: string; notes?: string }) => {
      const response = await api.post<ApiResponse<Inventory>>(
        "/inventory/adjust",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      toast.success("Điều chỉnh tồn kho thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Điều chỉnh tồn kho thất bại!");
    },
  });
}

// Reserve Inventory (for orders)
export function useReserveInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { items: Array<{ warehouseId: number; productId: number; quantity: number }>; referenceType: string; referenceId: number }) => {
      const response = await api.post<ApiResponse<any>>(
        "/inventory/reserve",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      toast.success("Đặt giữ hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Đặt giữ hàng thất bại!");
    },
  });
}

// Release Reserved Inventory
export function useReleaseReservedInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { items: Array<{ warehouseId: number; productId: number; quantity: number }>; referenceType: string; referenceId: number }) => {
      const response = await api.post<ApiResponse<any>>(
        "/inventory/release-reserved",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      toast.success("Hủy đặt giữ hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Hủy đặt giữ hàng thất bại!");
    },
  });
}
