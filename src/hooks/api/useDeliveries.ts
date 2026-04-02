import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type {
  Delivery,
  CreateDeliveryDto,
  UpdateDeliveryDto,
  UpdateDeliveryStatusDto,
  SettleDeliveryDto,
  DeliveryFilters,
  DeliveryStatistics,
  ApiResponse,
  PaginationParams,
} from "@/types";
import { toast } from "react-hot-toast";

/**
 * Query Keys
 */
export const deliveryKeys = {
  all: ["deliveries"] as const,
  lists: () => [...deliveryKeys.all, "list"] as const,
  list: (filters?: DeliveryFilters & PaginationParams) =>
    [...deliveryKeys.lists(), filters] as const,
  details: () => [...deliveryKeys.all, "detail"] as const,
  detail: (id: number) => [...deliveryKeys.details(), id] as const,
  statistics: () => [...deliveryKeys.all, "statistics"] as const,
};

/**
 * Get Deliveries List với filters & pagination
 */
export function useDeliveries(params?: DeliveryFilters & PaginationParams) {
  return useQuery({
    queryKey: deliveryKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Delivery[]>>("/deliveries", {
        params,
      });
      return response;
    },
  });
}

/**
 * Get Single Delivery by ID
 */
export function useDelivery(id: number, enabled = true) {
  return useQuery({
    queryKey: deliveryKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Delivery>>(`/deliveries/${id}`);
      return response;
    },
    enabled: enabled && !!id,
  });
}

/**
 * Get Delivery Statistics
 */
export function useDeliveryStatistics(filters?: DeliveryFilters) {
  return useQuery({
    queryKey: [...deliveryKeys.statistics(), filters],
    queryFn: async () => {
      const response = await api.get<ApiResponse<DeliveryStatistics>>(
        "/deliveries/statistics",
        { params: filters }
      );
      return response;
    },
  });
}

/**
 * Create Delivery Mutation
 */
export function useCreateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDeliveryDto) => {
      const response = await api.post<ApiResponse<Delivery>>("/deliveries", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.statistics() });
      toast.success("Tạo phiếu giao hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Tạo phiếu giao hàng thất bại!");
    },
  });
}

/**
 * Update Delivery Mutation
 */
export function useUpdateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateDeliveryDto }) => {
      const response = await api.put<ApiResponse<Delivery>>(`/deliveries/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.detail(variables.id) });
      toast.success("Cập nhật phiếu giao hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Cập nhật phiếu giao hàng thất bại!");
    },
  });
}

/**
 * Update Delivery Status Mutation
 */
export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateDeliveryStatusDto;
    }) => {
      const response = await api.put<ApiResponse<Delivery>>(
        `/deliveries/${id}/status`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.statistics() });
      toast.success("Cập nhật trạng thái giao hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Cập nhật trạng thái thất bại!");
    },
  });
}

/**
 * Upload Delivery Proof Mutation
 */
export function useUploadDeliveryProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append("proof", file);

      const response = await api.post<ApiResponse<Delivery>>(
        `/deliveries/${id}/proof`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });
      toast.success("Tải ảnh chứng minh thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Tải ảnh chứng minh thất bại!");
    },
  });
}

/**
 * Delete Delivery Mutation
 */
export function useDeleteDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<void>>(`/deliveries/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.statistics() });
      toast.success("Xóa phiếu giao hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Xóa phiếu giao hàng thất bại!");
    },
  });
}

/**
 * Settle Delivery (COD collection) Mutation
 */
export function useSettleDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SettleDeliveryDto }) => {
      const response = await api.post<ApiResponse<Delivery>>(
        `/deliveries/${id}/settle`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.statistics() });
      toast.success("Quyết toán giao hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Quyết toán giao hàng thất bại!");
    },
  });
}

/**
 * Bulk Update Delivery Status
 */
export function useBulkUpdateDeliveryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ids,
      status,
    }: {
      ids: number[];
      status: UpdateDeliveryStatusDto;
    }) => {
      const results = await Promise.allSettled(
        ids.map((id) =>
          api.put<ApiResponse<Delivery>>(`/deliveries/${id}/status`, status)
        )
      );

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      return { successful, failed, total: ids.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.statistics() });

      if (result.failed === 0) {
        toast.success(`Đã cập nhật ${result.successful} phiếu giao hàng thành công!`);
      } else {
        toast.success(
          `Đã cập nhật ${result.successful}/${result.total} phiếu. ${result.failed} phiếu thất bại.`
        );
      }
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Cập nhật trạng thái thất bại!");
    },
  });
}

/**
 * Assign Delivery Staff
 */
export function useAssignDeliveryStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      deliveryStaffId,
    }: {
      id: number;
      deliveryStaffId: number;
    }) => {
      const response = await api.patch<ApiResponse<Delivery>>(
        `/deliveries/${id}/assign`,
        { deliveryStaffId }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.detail(variables.id) });
      toast.success("Phân công nhân viên giao hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Phân công nhân viên thất bại!");
    },
  });
}

/**
 * Fail Delivery (with optional order cancellation)
 */
export function useFailDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { failureReason: string; notes?: string; cancelOrder?: boolean };
    }) => {
      const response = await api.post<ApiResponse<Delivery>>(
        `/deliveries/${id}/fail`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.statistics() });
      toast.success("Đã cập nhật trạng thái giao hàng thất bại!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Cập nhật trạng thái thất bại!");
    },
  });
}
