import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";

export interface OvertimeSession {
  id: number;
  sessionName: string;
  startTime: string;
  endTime?: string;
  status: 'open' | 'closed' | 'cancelled';
  notes?: string;
  createdBy: number;
  createdAt: string;
  creator?: {
    fullName: string;
  };
  entries?: OvertimeEntry[];
  _count?: {
    entries: number;
  };
}

export interface OvertimeEntry {
  id: number;
  userId: number;
  startTime?: string;
  endTime?: string;
  actualHours: number;
  user: {
    id: number;
    fullName: string;
    employeeCode: string;
    role?: {
      roleName: string;
    };
  };
}

// Stats Interface
export interface OvertimeStats {
  total: number;
  open: number;
  closed: number;
  totalHours: number;
  cancelled: number;
}

// Query Keys
export const overtimeKeys = {
  all: ["overtime"] as const,
  lists: () => [...overtimeKeys.all, "list"] as const,
  list: (params: any) => [...overtimeKeys.lists(), params] as const,
  details: () => [...overtimeKeys.all, "detail"] as const,
  detail: (id: number) => [...overtimeKeys.details(), id] as const,
  stats: () => [...overtimeKeys.all, "stats"] as const,
};

export const useOvertimeSessions = (params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
} = {}) => {
  return useQuery({
    queryKey: overtimeKeys.list(params),
    queryFn: async () => {
      const response = await api.get("/overtime", { params });
      return response.data;
    },
  });
};

export const useOvertimeStats = () => {
  return useQuery({
    queryKey: overtimeKeys.stats(),
    queryFn: async () => {
      const response = await api.get("/overtime/stats");
      return response.data;
    },
    // Mocking data if endpoint doesn't exist yet, or handle gracefully
    retry: false,
  });
};

export const useOvertimeSession = (id: number) => {
  return useQuery({
    queryKey: overtimeKeys.detail(id),
    enabled: !!id,
    queryFn: async () => {
      const response = await api.get(`/overtime/${id}`);
      return response.data;
    },
  });
};

// Create Session Mutation
export function useCreateOvertimeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { sessionName: string; startTime: string; notes?: string }) => {
      const response = await api.post("/overtime", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: overtimeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: overtimeKeys.stats() });
      toast.success("Tạo phiên tăng ca thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Tạo phiên tăng ca thất bại!");
    },
  });
}

// Add Employees Mutation
export function useAddEmployeesToOvertime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, userIds }: { sessionId: number; userIds: number[] }) => {
      const response = await api.post(`/overtime/${sessionId}/employees`, { userIds });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: overtimeKeys.detail(variables.sessionId) });
      queryClient.invalidateQueries({ queryKey: overtimeKeys.lists() });
      toast.success("Thêm nhân viên thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Thêm nhân viên thất bại!");
    },
  });
}

// Remove Employee Mutation
export function useRemoveEmployeeFromOvertime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, userId }: { sessionId: number; userId: number }) => {
      const response = await api.delete(`/overtime/${sessionId}/employees/${userId}`);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: overtimeKeys.detail(variables.sessionId) });
      toast.success("Xóa nhân viên khỏi phiên thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Xóa nhân viên thất bại!");
    },
  });
}

// Close Session Mutation
export function useCloseOvertimeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, endTime }: { sessionId: number; endTime: string }) => {
      const response = await api.post(`/overtime/${sessionId}/close`, { endTime });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: overtimeKeys.detail(variables.sessionId) });
      queryClient.invalidateQueries({ queryKey: overtimeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: overtimeKeys.stats() });
      toast.success("Đóng phiên tăng ca thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Đóng phiên tăng ca thất bại!");
    },
  });
}

// Direct API object for non-hook usage (e.g., imperative calls in event handlers)
export const overtimeApi = {
  addEmployees: async (sessionId: number, userIds: number[]) => {
    const { default: api } = await import("@/lib/axios");
    const response = await api.post(`/overtime/${sessionId}/employees`, { userIds });
    return response.data;
  },
  removeEmployee: async (sessionId: number, userId: number) => {
    const { default: api } = await import("@/lib/axios");
    const response = await api.delete(`/overtime/${sessionId}/employees/${userId}`);
    return response.data;
  },
  closeSession: async (sessionId: number, endTime: string) => {
    const { default: api } = await import("@/lib/axios");
    const response = await api.post(`/overtime/${sessionId}/close`, { endTime });
    return response.data;
  },
};
