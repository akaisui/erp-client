import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type {
  Bom,
  BomQueryParams,
  CreateBomInput,
  UpdateBomInput,
  CalculateMaterialsInput,
  CalculateMaterialsResult,
  ApproveBomInput,
  ApiResponse,
  PaginationParams,
} from "@/types";
import { toast } from "react-hot-toast";

// Query Keys
export const bomKeys = {
  all: ["bom"] as const,
  lists: () => [...bomKeys.all, "list"] as const,
  list: (filters?: BomQueryParams) => [...bomKeys.lists(), filters] as const,
  details: () => [...bomKeys.all, "detail"] as const,
  detail: (id: number) => [...bomKeys.details(), id] as const,
  byProduct: (productId: number) => [...bomKeys.all, "product", productId] as const,
  calculate: (bomId: number, quantity: number) =>
    [...bomKeys.all, "calculate", bomId, quantity] as const,
};

// Get BOMs List với filters & pagination
export function useBOMs(params?: BomQueryParams & PaginationParams) {
  return useQuery({
    queryKey: bomKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Bom[]>>("/bom", {
        params,
      });

      return response;
    },
  });
}

// Get Single BOM by ID
export function useBOM(id: number, enabled = true) {
  return useQuery({
    queryKey: bomKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Bom>>(`/bom/${id}`);
      return response;
    },
    enabled: enabled && !!id,
  });
}

// Get BOMs by Finished Product
export function useBOMsByProduct(productId: number, enabled = true) {
  return useQuery({
    queryKey: bomKeys.byProduct(productId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Bom[]>>(`/bom/product/${productId}`);
      return response;
    },
    enabled: enabled && !!productId,
  });
}

// Calculate Material Requirements
export function useCalculateMaterials() {
  return useMutation({
    mutationFn: async (data: CalculateMaterialsInput) => {
      const response = await api.post<ApiResponse<CalculateMaterialsResult>>(
        "/bom/calculate",
        data
      );
      return response;
    },
  });
}

// Create BOM
export function useCreateBOM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBomInput) => {
      const response = await api.post<ApiResponse<Bom>>("/bom", data);
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: bomKeys.lists() });

      const responseApi = response as unknown as ApiResponse<Bom>;

      // Invalidate product's BOM list
      if (responseApi.data?.finishedProductId) {
        queryClient.invalidateQueries({
          queryKey: bomKeys.byProduct(responseApi.data.finishedProductId),
        });
      }

      toast.success("Tạo BOM thành công!");
    },
    onError: (error: any) => {
      const errorMessage = "Tạo BOM thất bại!";
      toast.error(errorMessage);
    },
  });
}

// Update BOM
export function useUpdateBOM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateBomInput }) => {
      const response = await api.put<ApiResponse<Bom>>(`/bom/${id}`, data);
      return response;
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: bomKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bomKeys.detail(variables.id) });

      const responseApi = response as unknown as ApiResponse<Bom>;

      // Invalidate product's BOM list
      if (responseApi.data?.finishedProductId) {
        queryClient.invalidateQueries({
          queryKey: bomKeys.byProduct(responseApi.data.finishedProductId),
        });
      }

      toast.success("Cập nhật BOM thành công!");
    },
    onError: (error: any) => {
      const errorMessage = "Cập nhật BOM thất bại!";
      toast.error(errorMessage);
    },
  });
}

// Delete BOM
export function useDeleteBOM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<void>>(`/bom/${id}`);
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: bomKeys.lists() });
      toast.success("Xóa BOM thành công!");
    },
    onError: (error: any) => {
      const errorMessage = "Xóa BOM thất bại!";
      toast.error(errorMessage);
    },
  });
}

// Approve BOM
export function useApproveBOM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: ApproveBomInput }) => {
      const response = await api.put<ApiResponse<Bom>>(`/bom/${id}/approve`, data);
      return response;
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: bomKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bomKeys.detail(variables.id) });

      const responseApi = response as unknown as ApiResponse<Bom>;
      // Invalidate product's BOM list
      if (responseApi.data?.finishedProductId) {
        queryClient.invalidateQueries({
          queryKey: bomKeys.byProduct(responseApi.data.finishedProductId),
        });
      }

      toast.success(responseApi.message || "Phê duyệt BOM thành công!");
    },
    onError: (error: any) => {
      const errorMessage = "Phê duyệt BOM thất bại!";
      toast.error(errorMessage);
    },
  });
}

// Set BOM to Inactive
export function useSetBOMInactive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await api.put<ApiResponse<Bom>>(`/bom/${id}/inactive`, {
        reason,
      });
      return response;
    },
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: bomKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bomKeys.detail(variables.id) });

      const responseApi = response as unknown as ApiResponse<Bom>;

      // Invalidate product's BOM list
      if (responseApi.data?.finishedProductId) {
        queryClient.invalidateQueries({
          queryKey: bomKeys.byProduct(responseApi.data.finishedProductId),
        });
      }

      toast.success(responseApi.message || "Đã đặt BOM thành không hoạt động!");
    },
    onError: (error: any) => {
      const errorMessage = "Thay đổi trạng thái BOM thất bại!";
      toast.error(errorMessage);
    },
  });
}
