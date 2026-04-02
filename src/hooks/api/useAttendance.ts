import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import type {
  ApiResponse,
  Attendance,
  AttendanceFilters,
  AttendanceStatistics,
  MonthlyReport,
  TodayAttendanceStatus,
  CheckInDto,
  CheckOutDto,
  RequestLeaveDto,
  UpdateAttendanceDto,
  ApproveLeaveDto,
  PaginationParams,
} from "@/types";

// Query Keys
export const attendanceKeys = {
  all: ["attendance"] as const,
  lists: () => [...attendanceKeys.all, "list"] as const,
  list: (filters?: AttendanceFilters) => [...attendanceKeys.lists(), filters] as const,
  my: () => [...attendanceKeys.all, "my"] as const,
  myList: (filters?: AttendanceFilters) => [...attendanceKeys.my(), filters] as const,
  today: () => [...attendanceKeys.all, "today"] as const,
  details: () => [...attendanceKeys.all, "detail"] as const,
  detail: (id: number) => [...attendanceKeys.details(), id] as const,
  statistics: () => [...attendanceKeys.all, "statistics"] as const,
  report: (month?: string) => [...attendanceKeys.all, "report", month] as const,
};

// Query
// Get All Attendance Records (Admin/Manager)
export function useAttendance(filters?: AttendanceFilters & PaginationParams) {
  return useQuery({
    queryKey: attendanceKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Attendance[]>>("/attendance", {
        params: filters,
      });
      return response;
    },
  });
}

// Get My Attendance Records
export function useMyAttendance(filters?: AttendanceFilters) {
  return useQuery({
    queryKey: attendanceKeys.myList(filters),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Attendance[]>>("/attendance/my", {
        params: filters,
      });
      return response;
    },
  });
}

// Get Today's Attendance Status
export function useTodayAttendance() {
  return useQuery({
    queryKey: attendanceKeys.today(),
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get<ApiResponse<Attendance[]>>("/attendance/my", {
        params: { fromDate: today, toDate: today },
      });

      const todayRecord = response.data.data?.[0];

      const status: TodayAttendanceStatus = {
        hasCheckedIn: !!todayRecord?.checkInTime,
        hasCheckedOut: !!todayRecord?.checkOutTime,
        checkInTime: todayRecord?.checkInTime,
        checkOutTime: todayRecord?.checkOutTime,
        workHours: todayRecord?.workHours,
        status: todayRecord?.status || "absent",
      };

      return { data: status };
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

// Get Single Attendance Record
export function useAttendanceDetail(id: number, enabled = true) {
  return useQuery({
    queryKey: attendanceKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Attendance>>(`/attendance/${id}`);
      return response;
    },
    enabled: enabled && !!id,
  });
}

// Get Attendance Statistics
export function useAttendanceStatistics(filters?: AttendanceFilters) {
  return useQuery({
    queryKey: attendanceKeys.statistics(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<AttendanceStatistics>>(
        "/attendance/statistics",
        { params: filters }
      );
      return response;
    },
  });
}

// Get Monthly Report
export function useMonthlyReport(month?: string) {
  return useQuery({
    queryKey: attendanceKeys.report(month),
    queryFn: async () => {
      const response = await api.get<ApiResponse<MonthlyReport>>("/attendance/report", {
        params: { month },
      });
      return response;
    },
    enabled: !!month,
  });
}

// MUTATION HOOKS
// Check In
export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CheckInDto = {}) => {
      const response = await api.post<ApiResponse<Attendance>>(
        "/attendance/check-in",
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.today() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.my() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
      toast.success("Chấm công vào thành công!");
    },
    onError: (error: any) => {
      toast.error(error.error?.message || "Chấm công vào thất bại!");
    },
  });
}

// Check Out
export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CheckOutDto = {}) => {
      const response = await api.post<ApiResponse<Attendance>>(
        "/attendance/check-out",
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.today() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.my() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
      toast.success("Chấm công ra thành công!");
    },
    onError: (error: any) => {
      toast.error(error.error?.message || "Chấm công ra thất bại!");
    },
  });
}

// Request Leave
export function useRequestLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RequestLeaveDto) => {
      const response = await api.post<ApiResponse<Attendance>>(
        "/attendance/leave",
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.my() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
      toast.success("Yêu cầu nghỉ phép đã được gửi!");
    },
    onError: (error: any) => {
      toast.error(error.error?.message || "Gửi yêu cầu nghỉ phép thất bại!");
    },
  });
}

// Update Attendance (Admin)
export function useUpdateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateAttendanceDto }) => {
      const response = await api.put<ApiResponse<Attendance>>(
        `/attendance/${id}`,
        data
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.detail(variables.id) });
      toast.success("Cập nhật chấm công thành công!");
    },
    onError: (error: any) => {
      toast.error(error.error?.message || "Cập nhật chấm công thất bại!");
    },
  });
}

// Approve/Reject Leave
export function useApproveLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ApproveLeaveDto }) => {
      const response = await api.put<ApiResponse<Attendance>>(
        `/attendance/${id}/approve`,
        data
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.detail(variables.id) });
      toast.success(
        variables.data.approved ? "Đã phê duyệt nghỉ phép!" : "Đã từ chối nghỉ phép!"
      );
    },
    onError: (error: any) => {
      toast.error(error.error?.message || "Xử lý nghỉ phép thất bại!");
    },
  });
}

// Delete Attendance (Admin)
export function useDeleteAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<void>>(`/attendance/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
      toast.success("Xóa bản ghi chấm công thành công!");
    },
    onError: (error: any) => {
      toast.error(error.error?.message || "Xóa bản ghi chấm công thất bại!");
    },
  });
}

// Lock Attendance Month
export function useLockAttendanceMonth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (month: string) => {
      const response = await api.post<ApiResponse<void>>("/attendance/lock-month", {
        month,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.statistics() });
      toast.success("Chốt công tháng thành công!");
    },
    onError: (error: any) => {
      toast.error(error.error?.message || "Chốt công tháng thất bại!");
    },
  });
}

// Import Attendance from File
export function useImportAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await api.post<ApiResponse<any>>("/attendance/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.lists() });
      toast.success(
        `Nhập thành công ${data.data.summary.validCount} bản ghi. ${
          data.data.summary.invalidCount > 0
            ? `${data.data.summary.invalidCount} bản ghi lỗi.`
            : ""
        }`
      );
    },
    onError: (error: any) => {
      toast.error(error.error?.message || "Nhập dữ liệu thất bại!");
    },
  });
}
