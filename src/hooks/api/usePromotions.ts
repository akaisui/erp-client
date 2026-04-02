import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type {
  ApiResponse,
  PaginationParams,
  PaginationMeta,
} from "@/types/common.types";
import type {
  Promotion,
  CreatePromotionDto,
  UpdatePromotionDto,
  ApprovePromotionDto,
  CancelPromotionDto,
  ApplyPromotionDto,
  ApplyPromotionResult,
  PromotionFilters,
  PromotionStatistics,
} from "@/types/promotion.types";
import { toast } from "react-hot-toast";

// =====================================================
// QUERY KEYS
// =====================================================

export const promotionKeys = {
  all: ["promotions"] as const,
  lists: () => [...promotionKeys.all, "list"] as const,
  list: (filters?: PromotionFilters & PaginationParams) =>
    [...promotionKeys.lists(), filters] as const,
  details: () => [...promotionKeys.all, "detail"] as const,
  detail: (id: number) => [...promotionKeys.details(), id] as const,
  active: () => [...promotionKeys.all, "active"] as const,
  statistics: (filters?: PromotionFilters) =>
    [...promotionKeys.all, "statistics", filters] as const,
};

// =====================================================
// QUERY HOOKS
// =====================================================

// Get promotions list with filters
export function usePromotions(
  filters?: PromotionFilters & PaginationParams 
) {
  return useQuery({
    queryKey: promotionKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<
        ApiResponse<Promotion[] >
      >("/promotions", {
        params: filters,
      });
      return response;
    },
  });
}

// Get single promotion by ID
export function usePromotion(id: number) {
  return useQuery({
    queryKey: promotionKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Promotion>>(
        `/promotions/${id}`
      );
      return response;
    },
    enabled: !!id,
  });
}

// Get active promotions
export function useActivePromotions(filters?: {
  applicableTo?: string;
  customerId?: number;
}) {
  return useQuery({
    queryKey: promotionKeys.active(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Promotion[]>>(
        "/promotions/active",
        {
          params: filters,
        }
      );
      return response;
    },
  });
}

// Get promotion statistics
export function usePromotionStatistics(filters?: PromotionFilters) {
  return useQuery({
    queryKey: promotionKeys.statistics(filters),
    queryFn: async () => {
      const response = await api.get<ApiResponse<PromotionStatistics>>(
        "/promotions/statistics",
        {
          params: filters,
        }
      );
      return response;
    },
  });
}

// =====================================================
// MUTATION HOOKS
// =====================================================

// Create new promotion
export function useCreatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePromotionDto) => {
      const response = await api.post<ApiResponse<Promotion>>(
        "/promotions",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promotionKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: promotionKeys.statistics(),
      });
      toast.success("Tạo chương trình khuyến mãi thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.error?.message ||
          "Tạo chương trình khuyến mãi thất bại!"
      );
    },
  });
}

// Update promotion
export function useUpdatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdatePromotionDto;
    }) => {
      const response = await api.put<ApiResponse<Promotion>>(
        `/promotions/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: promotionKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: promotionKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: promotionKeys.statistics(),
      });
      toast.success("Cập nhật chương trình khuyến mãi thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.error?.message ||
          "Cập nhật chương trình khuyến mãi thất bại!"
      );
    },
  });
}

// Approve promotion
export function useApprovePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data?: ApprovePromotionDto;
    }) => {
      const response = await api.put<ApiResponse<Promotion>>(
        `/promotions/${id}/approve`,
        data || {}
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: promotionKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: promotionKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: promotionKeys.active(),
      });
      queryClient.invalidateQueries({
        queryKey: promotionKeys.statistics(),
      });
      toast.success("Phê duyệt chương trình khuyến mãi thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.error?.message ||
          "Phê duyệt chương trình khuyến mãi thất bại!"
      );
    },
  });
}

// Cancel promotion
export function useCancelPromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: CancelPromotionDto;
    }) => {
      const response = await api.delete<ApiResponse<Promotion>>(
        `/promotions/${id}`,
        {
          data,
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: promotionKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: promotionKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: promotionKeys.active(),
      });
      queryClient.invalidateQueries({
        queryKey: promotionKeys.statistics(),
      });
      toast.success("Hủy chương trình khuyến mãi thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.error?.message ||
          "Hủy chương trình khuyến mãi thất bại!"
      );
    },
  });
}

// Delete promotion (hard delete)
export function useDeletePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<void>>(
        `/promotions/${id}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: promotionKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: promotionKeys.statistics(),
      });
      toast.success("Xóa chương trình khuyến mãi thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.error?.message ||
          "Xóa chương trình khuyến mãi thất bại!"
      );
    },
  });
}

// Apply promotion to order
export function useApplyPromotion() {
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: ApplyPromotionDto;
    }) => {
      const response = await api.post<ApiResponse<ApplyPromotionResult>>(
        `/promotions/${id}/apply`,
        data
      );
      return response.data;
    },
    onError: (error: any) => {
      toast.error(
        error?.error?.message || "Áp dụng khuyến mãi thất bại!"
      );
    },
  });
}

// Auto-expire promotions
export function useAutoExpirePromotions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<
        ApiResponse<{ expiredCount: number }>
      >("/promotions/auto-expire");
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: promotionKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: promotionKeys.active(),
      });
      queryClient.invalidateQueries({
        queryKey: promotionKeys.statistics(),
      });
      toast.success(
        `Đã hết hạn ${data.data?.expiredCount || 0} chương trình khuyến mãi`
      );
    },
    onError: (error: any) => {
      toast.error(
        error?.error?.message || "Cập nhật trạng thái thất bại!"
      );
    },
  });
}

// Refresh promotions cache
export function useRefreshPromotions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Invalidate all promotion queries to force refetch
      await queryClient.invalidateQueries({
        queryKey: promotionKeys.lists(),
      });
      await queryClient.invalidateQueries({
        queryKey: promotionKeys.statistics(),
      });
      return { success: true };
    },
    onSuccess: () => {
      toast.success("Dữ liệu đã được làm mới!");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Không thể làm mới dữ liệu!"
      );
    },
  });
}