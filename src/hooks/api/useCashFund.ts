import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import type { ApiResponse } from "@/types";

interface CashFund {
  id: number;
  fundDate: string;
  openingBalance: number;
  closingBalance: number;
  totalReceipts: number;
  totalPayments: number;
  isLocked: boolean;
  lockedAt?: string;
  approver?: { id: number; fullName: string; employeeCode: string };
  reconciler?: { id: number; fullName: string; employeeCode: string };
  notes?: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface CashFundFilters extends PaginationParams {
  startDate?: string;
  endDate?: string;
  isLocked?: boolean;
}

interface CreateCashFundInput {
  fundDate: string;
  openingBalance?: number;
  notes?: string;
}

interface LockCashFundInput {
  approvedBy?: number;
  reconciledBy?: number;
  notes?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// =====================================================
// QUERY KEYS
// =====================================================
export const cashFundKeys = {
  all: ["cash-fund"] as const,
  lists: () => [...cashFundKeys.all, "list"] as const,
  list: (filters?: CashFundFilters) =>
    [...cashFundKeys.lists(), filters] as const,
  details: () => [...cashFundKeys.all, "detail"] as const,
  detail: (fundDate: string) => [...cashFundKeys.details(), fundDate] as const,
  summary: (startDate?: string, endDate?: string) =>
    [...cashFundKeys.all, "summary", startDate, endDate] as const,
  discrepancies: (fundDate?: string) =>
    [...cashFundKeys.all, "discrepancies", fundDate] as const,
};

// =====================================================
// QUERY HOOKS
// =====================================================

// Get all cash funds with filters
export function useCashFunds(filters?: CashFundFilters) {
  return useQuery({
    queryKey: cashFundKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<ApiResponse<CashFund[]>>(
        "/cash-fund",
        {
          params: filters,
        }
      );
      return response;
    },
  });
}

// Get cash fund by date
export function useCashFund(fundDate: string) {
  return useQuery({
    queryKey: cashFundKeys.detail(fundDate),
    queryFn: async () => {
      const response = await api.get<ApiResponse<CashFund>>(
        `/cash-fund/${fundDate}`
      );
      return response.data;
    },
    enabled: !!fundDate,
  });
}

// Get cash fund summary for date range
export function useCashFundSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: cashFundKeys.summary(startDate, endDate),
    queryFn: async () => {
      const response = await api.get(`/cash-fund/summary`, {
        params: { startDate, endDate },
      });
      return response.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

// Get discrepancies for a cash fund
export function useCashFundDiscrepancies(fundDate?: string) {
  return useQuery({
    queryKey: cashFundKeys.discrepancies(fundDate),
    queryFn: async () => {
      const response = await api.get(
        `/cash-fund/${fundDate}/discrepancies`
      );
      return response.data;
    },
    enabled: !!fundDate,
  });
}

// =====================================================
// MUTATION HOOKS
// =====================================================

// Create new cash fund
export function useCreateCashFund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCashFundInput) => {
      const response = await api.post<ApiResponse<CashFund>>(
        "/cash-fund",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashFundKeys.lists() });
      toast.success("Tạo quỹ tiền mặt thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error?.message || "Tạo quỹ tiền mặt thất bại!"
      );
    },
  });
}

// Lock cash fund
export function useLockCashFund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fundDate,
      data,
    }: {
      fundDate: string;
      data?: LockCashFundInput;
    }) => {
      const response = await api.put<ApiResponse<CashFund>>(
        `/cash-fund/${fundDate}/lock`,
        data || {}
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cashFundKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: cashFundKeys.detail(variables.fundDate),
      });
      toast.success("Khóa quỹ tiền mặt thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error?.message || "Khóa quỹ tiền mặt thất bại!"
      );
    },
  });
}

// Unlock cash fund
export function useUnlockCashFund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fundDate: string) => {
      const response = await api.put<ApiResponse<CashFund>>(
        `/cash-fund/${fundDate}/unlock`
      );
      return response.data;
    },
    onSuccess: (data, fundDate) => {
      queryClient.invalidateQueries({ queryKey: cashFundKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: cashFundKeys.detail(fundDate),
      });
      toast.success("Mở khóa quỹ tiền mặt thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error?.message || "Mở khóa quỹ tiền mặt thất bại!"
      );
    },
  });
}

// Refresh cache
export function useRefreshCashFund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<{ message: string }>>(
        "/cash-fund/refresh"
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashFundKeys.lists() });
      queryClient.invalidateQueries({ queryKey: cashFundKeys.all });
      toast.success("Làm mới dữ liệu thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.error?.message || "Làm mới dữ liệu thất bại!"
      );
    },
  });
}
