import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { PurchaseOrder, ApiResponse, PaginationParams, POCard } from "@/types";
import { toast } from "react-hot-toast";
import { type UpdatePurchaseOrderFormData, 
         type CreatePurchaseOrderFormData, 
         type ReceivePurchaseOrderFormData, 
         type PurchaseOrderFilters } 
            from "@/lib/validations";

// Query Keys
export const purchaseOrderKeys = {
  all: ["purchase-orders"] as const,
  lists: () => [...purchaseOrderKeys.all, "list"] as const,
  list: (params?: any) => [...purchaseOrderKeys.lists(), params] as const,
  details: () => [...purchaseOrderKeys.all, "detail"] as const,
  detail: (id: number) => [...purchaseOrderKeys.details(), id] as const,
};

// Get Purchase Orders List
export function usePurchaseOrders(params?: PurchaseOrderFilters & PaginationParams) {
  return useQuery({
    queryKey: purchaseOrderKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<PurchaseOrder[]> & { cards: POCard }>(
        "/purchase-orders",
        { params }
      );
      return response;
    },
  });
}

// Get Single Purchase Order
export function usePurchaseOrder(id: number, enabled = true) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<PurchaseOrder>>(
        `/purchase-orders/${id}`
      );
      return response;
    },
    enabled: enabled && !!id,
  });
}

// Get Supplier Purchase Orders
export function useSupplierPurchaseOrders(supplierId: number, params?: PaginationParams) {
  return useQuery({
    queryKey: [...purchaseOrderKeys.lists(), { supplierId, ...params }],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PurchaseOrder[]>>(
        "/purchase-orders",
        { params: { supplierId, ...params } }
      );
      return response;
    },
    enabled: !!supplierId,
  });
}

// Create Purchase Order
export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePurchaseOrderFormData) => {
      const response = await api.post<ApiResponse<PurchaseOrder>>(
        "/purchase-orders",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      toast.success("Tạo đơn đặt hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Tạo đơn đặt hàng thất bại!");
    },
  });
}

// Update Purchase Order
export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdatePurchaseOrderFormData;
    }) => {
      const response = await api.put<ApiResponse<PurchaseOrder>>(
        `/purchase-orders/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: purchaseOrderKeys.detail(variables.id),
      });
      toast.success("Cập nhật đơn đặt hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Cập nhật đơn đặt hàng thất bại!");
    },
  });
}

// Approve Purchase Order
export function useApprovePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const response = await api.put<ApiResponse<PurchaseOrder>>(
        `/purchase-orders/${id}/approve`,
        { notes }
      );
      return response.data;
    },
    onSuccess: async (data, variables) => {
      // Invalidate all purchase order queries
      await queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists(), refetchType: "active" });
      await queryClient.invalidateQueries({
            queryKey: purchaseOrderKeys.detail(variables.id),
            refetchType: "active",
      });
      toast.success("Phê duyệt đơn đặt hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Phê duyệt đơn đặt hàng thất bại!");
    },
  });
}

// Send Email Purchase Order
export function useSendEmailPurchaseOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id }: { id: number }) => {
            const response = await api.put<ApiResponse<PurchaseOrder>>(
                `/purchase-orders/${id}/send-email`,
            );
            return response.data;
        },
        onSuccess: async (data, variables) => {
            await queryClient.invalidateQueries({
                queryKey: purchaseOrderKeys.detail(variables.id),
                refetchType: "active",
            });
            toast.success("Gửi email thành công!");
        },
        onError: (error: any) => {
            console.log(error);
            toast.error(error.error.message);
        },
    })
}

// Receive Purchase Order (creates import stock transaction)
export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      details,
      notes,
    }: ReceivePurchaseOrderFormData) => {
      const response = await api.put<ApiResponse<PurchaseOrder>>(
        `/purchase-orders/${id}/receive`,
        { details, notes }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: purchaseOrderKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ["stock-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Nhận hàng thành công! Phiếu nhập kho đã được tạo.");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Nhận hàng thất bại!");
    },
  });
}

// Cancel Purchase Order
export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await api.put<ApiResponse<PurchaseOrder>>(
        `/purchase-orders/${id}/cancel`,
        { reason }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate all purchase order queries
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({
         queryKey: purchaseOrderKeys.detail(variables.id),
      });
      toast.success("Hủy đơn đặt hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Hủy đơn đặt hàng thất bại!");
    },
  });
}

// Delete Purchase Order
export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<void>>(`/purchase-orders/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      toast.success("Xóa đơn đặt hàng thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Không thể xóa đơn đặt hàng");
    },
  });
}