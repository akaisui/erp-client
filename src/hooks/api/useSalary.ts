import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import type { ApiResponse, PaginationParams } from "@/types/common.types";
import type {
  Salary,
  SalaryFilters,
  SalarySummary,
  SalaryCalculationResult,
} from "@/types/salary.types";
import type { ApproveSalaryFormValues, CalculateSalaryFormValues, PaySalaryFormValues, UpdateSalaryFormValues } from "@/lib/validations";

// Query Keys
export const salaryKeys = {
  all: ["salary"] as const,
  lists: () => [...salaryKeys.all, "list"] as const,
  list: (filters?: SalaryFilters) => [...salaryKeys.lists(), filters] as const,
  details: () => [...salaryKeys.all, "detail"] as const,
  detail: (id: number) => [...salaryKeys.details(), id] as const,
  byUserMonth: (userId: number, month: string) =>
    [...salaryKeys.all, "user-month", userId, month] as const,
  summary: (fromMonth: string, toMonth: string) =>
    [...salaryKeys.all, "summary", fromMonth, toMonth] as const,
};

// Query Hooks
// Get all salary records with filters (Admin/Manager)
export function useSalary(params?: SalaryFilters & PaginationParams) {
  return useQuery({
    queryKey: salaryKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Salary[]>>("/salary",{
        params: params,
      });
      return response;
    },
  });
}

// Get salary by ID
export function useSalaryDetail(id: number) {
  return useQuery({
    queryKey: salaryKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Salary>>(`/salary/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

// Get salary by user and month
export function useSalaryByUserMonth(userId: number, month: string) {
  return useQuery({
    queryKey: salaryKeys.byUserMonth(userId, month),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Salary>>(
        `/salary/${userId}/${month}`
      );
      return response;
    },
    enabled: !!userId && !!month,
  });
}

// Get salary summary (aggregated data)
export function useSalarySummary(fromMonth: string, toMonth: string) {
  return useQuery({
    queryKey: salaryKeys.summary(fromMonth, toMonth),
    queryFn: async () => {
      const response = await api.get<ApiResponse<SalarySummary>>(
        "/salary/summary",
        { params: { fromMonth, toMonth } }
      );
      return response;
    },
    enabled: !!fromMonth && !!toMonth,
  });
}

// Mutation Hooks
// Calculate salary for a user in a month
export function useCalculateSalary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CalculateSalaryFormValues) => {
      const response = await api.post<ApiResponse<SalaryCalculationResult>>(
        "/salary/calculate",
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryKeys.lists() });
      toast.success("Tính lương thành công!");
    },
    onError: (error: any) => {
      toast.error(error.error?.message || "Tính lương thất bại!");
    },
  });
}

// Recalculate existing salary
export function useRecalculateSalary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<ApiResponse<Salary>>(
        `/salary/${id}/recalculate`
      );
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: salaryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salaryKeys.detail(id) });
      toast.success("Tính lại lương thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error.error?.message || "Tính lại lương thất bại!"
      );
    },
  });
}

// Update salary manually
export function useUpdateSalary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateSalaryFormValues }) => {
      const response = await api.put<ApiResponse<Salary>>(`/salary/${id}`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salaryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salaryKeys.detail(id) });
      toast.success("Cập nhật lương thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error.error?.message || "Cập nhật lương thất bại!"
      );
    },
  });
}

// Approve salary
export function useApproveSalary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: ApproveSalaryFormValues }) => {
      const response = await api.put<ApiResponse<Salary>>(
        `/salary/${id}/approve`,
        data
      );
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salaryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salaryKeys.detail(id) });
      toast.success("Phê duyệt lương thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error.error?.message || "Phê duyệt lương thất bại!"
      );
    },
  });
}

// Pay salary
export function usePaySalary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PaySalaryFormValues }) => {
      const response = await api.post<
        ApiResponse<{ salary: Salary; voucher: any }>
      >(`/salary/${id}/pay`, data);
      return response;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: salaryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salaryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ["paymentVouchers"] });
      toast.success("Thanh toán lương thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Thanh toán lương thất bại!"
      );
    },
  });
}

// Delete salary
export function useDeleteSalary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<{ id: number }>>(
        `/salary/${id}`
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salaryKeys.lists() });
      toast.success("Xóa bảng lương thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error.error?.message || "Xóa bảng lương thất bại!"
      );
    },
  });
}
