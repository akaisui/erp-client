import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type {
  SalesOrder,
  SalesOrderFilters,
  ApiResponse,
  PaginationParams,
} from "@/types";
import { toast } from "react-hot-toast";


export const salesKeys = {
  all: ["sales"] as const,
  orders: () => [...salesKeys.all, "orders"] as const,
  ordersList: (filters?: SalesOrderFilters & PaginationParams) =>
    [...salesKeys.orders(), filters] as const,
  orderDetail: (id: number) => [...salesKeys.orders(), id] as const,
};


export function useAddPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddPaymentDto) => {
      const response = await api.post<ApiResponse<SalesOrder>>(
        `/sales/orders/${data.order_id}/payments`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.orders() });
      queryClient.invalidateQueries({
        queryKey: salesKeys.orderDetail(data.id),
      });
      toast.success("Thêm thanh toán thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Thêm thanh toán thất bại!");
    },
  });
}

/**
 * Validate Credit Limit before creating order
 */
export function useValidateCreditLimit() {
  return useMutation({
    mutationFn: async ({
      customer_id,
      order_amount,
    }: {
      customer_id: number;
      order_amount: number;
    }) => {
      const response = await api.post<ApiResponse<{ valid: boolean; message?: string }>>(
        "/sales/validate-credit-limit",
        { customer_id, order_amount }
      );
      return response.data;
    },
  });
}
