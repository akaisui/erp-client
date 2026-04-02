import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import type {
  ProductionOrderFilters,
  PaginationParams,
} from "@/types";
import { CancelProductionInput, CompleteProductionInput, CreateProductionOrderInput, StartProductionInput, UpdateProductionOrderInput } from "@/lib/validations";

// Query Keys
export const PRODUCTION_ORDER_KEYS = {
  all: ["production-orders"] as const,
  lists: () => [...PRODUCTION_ORDER_KEYS.all, "list"] as const,
  list: (filters?: ProductionOrderFilters) =>
    [...PRODUCTION_ORDER_KEYS.lists(), filters] as const,
  details: () => [...PRODUCTION_ORDER_KEYS.all, "detail"] as const,
  detail: (id: number) => [...PRODUCTION_ORDER_KEYS.details(), id] as const,
  wastage: (id: number) => [...PRODUCTION_ORDER_KEYS.detail(id), "wastage"] as const,
};

// Get all production orders
export function useProductionOrders(filters?: ProductionOrderFilters & PaginationParams) {
  return useQuery({
    queryKey: PRODUCTION_ORDER_KEYS.list(filters),
    queryFn: async () => {
      const response = await api.get("/production-orders", { params: filters });
      return response;
    },
  });
}

// Get production order by ID
export function useProductionOrder(id: number, enabled = true) {
  return useQuery({
    queryKey: PRODUCTION_ORDER_KEYS.detail(id),
    queryFn: async () => {
      const response = await api.get(`/production-orders/${id}`);
      return response ;
    },
    enabled: enabled && !!id,
  });
}

// Get wastage report
export function useWastageReport(id: number, enabled = true) {
  return useQuery({
    queryKey: PRODUCTION_ORDER_KEYS.wastage(id),
    queryFn: async () => {
      const response = await api.get(`/production-orders/${id}/wastage`);
      return response ;
    },
    enabled: enabled && !!id,
  });
}

// Create production order
export function useCreateProductionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductionOrderInput) => {
      const response = await api.post("/production-orders", data);
      return response ;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTION_ORDER_KEYS.lists() });
      toast.success("Tạo lệnh sản xuất thành công!");
    },
    onError: (error: any) => {
      toast.error("Không thể tạo lệnh sản xuất");
    },
  });
}

// Update production order
export function useUpdateProductionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateProductionOrderInput }) => {
      const response = await api.put(`/production-orders/${id}`, data);
      return response ;
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTION_ORDER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUCTION_ORDER_KEYS.detail(variables.id) });
      toast.success("Cập nhật lệnh sản xuất thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Không thể cập nhật lệnh sản xuất");
    },
  });
}

// Start production
export function useStartProduction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: StartProductionInput }) => {
      const response = await api.put(`/production-orders/${id}/start`, data || {});
      return response ;
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTION_ORDER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUCTION_ORDER_KEYS.detail(variables.id) });

      const transactionCode = (response as any).meta?.stockTransaction?.code;
      toast.success(
        `Bắt đầu sản xuất thành công! Phiếu xuất kho: ${transactionCode}`,
        { duration: 4000 }
      );
    },
    onError: (error: any) => {
      let errorMessage = "Không thể bắt đầu sản xuất";

      toast.error(error.error.message || errorMessage);
    },
  });
}

// Complete production
export function useCompleteProduction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CompleteProductionInput }) => {
      const response = await api.put(`/production-orders/${id}/complete`, data);
      return response ;
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTION_ORDER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUCTION_ORDER_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: PRODUCTION_ORDER_KEYS.wastage(variables.id) });

      const transactionCode = (response as any).meta?.stockTransaction?.code;
      const totalWastage = (response as any).meta?.totalWastage || 0;

      if (totalWastage > 0) {
        toast.success(
          `Hoàn thành sản xuất! Phiếu nhập kho: ${transactionCode}. Hao hụt: ${totalWastage.toLocaleString()} VNĐ`,
          { duration: 5000 }
        );
      } else {
        toast.success(
          `Hoàn thành sản xuất thành công! Phiếu nhập kho: ${transactionCode}`,
          { duration: 4000 }
        );
      }
    },
    onError: (error: any) => {
      let errorMessage = "Không thể hoàn thành sản xuất";

      toast.error(error.error.message || errorMessage);
    },
  });
}

// Cancel production order
export function useCancelProductionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CancelProductionInput }) => {
      const response = await api.put(`/production-orders/${id}/cancel`, data);
      return response ;
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTION_ORDER_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PRODUCTION_ORDER_KEYS.detail(variables.id) });
      toast.success("Đã hủy lệnh sản xuất");
    },
    onError: (error: any) => {
      let errorMessage = "Không thể hủy lệnh sản xuất";
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    },
  });
}

// Delete production order
export function useDeleteProductionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/production-orders/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTION_ORDER_KEYS.lists() });
      toast.success("Xóa lệnh sản xuất thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Không thể xóa lệnh sản xuất");
    },
  });
}
