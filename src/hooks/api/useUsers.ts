import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import type {
  ApiResponse,
  User,
  UpdateUserStatusDto,
  UploadAvatarResponse,
  UserFilters,
  PaginationParams,
} from "@/types";
import { CreateUserFormData, UpdateUserFormData } from "@/lib/validations";

export const userKeys = {
  all: ["users"] as const,
  me: () => [...userKeys.all, "me"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters?: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
};

// Get Current User Profile
export function useProfile() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<User>>("/users/me");
      return response;
    },
  });
}

// Get Users List with Filters
export function useUsers(params?: UserFilters & PaginationParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: async () => {
      const response = await api.get<ApiResponse<User[]>>("/users", {
        params: params,
      });
      return response;
    },
  });
}

// Get Single User by ID
export function useUser(id: number, enabled = true) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<User>>(`/users/${id}`);
      return response;
    },
    enabled: enabled && !!id,
  });
}

// MUTATION HOOKS
// Create New User
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      const response = await api.post<ApiResponse<User>>("/users", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("Tạo nhân viên thành công!");
    },
    onError: (error: any) => {
      if(error.error.code === 'VALIDATION_ERROR') {
        for(let i = 0; i < error.error.details.length; i++) {
          toast.error(error.error.details[i].message);
          break;
        }
      }else {
        toast.error(error.error?.message || "Tạo nhân viên thất bại!");
      }
    },
  });
}

// Update User
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateUserFormData }) => {
      const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      toast.success("Cập nhật thông tin nhân viên thành công!");
    },
    onError: (error: any) => {
      toast.error(error.error?.message || "Cập nhật thông tin thất bại!");
    },
  });
}

// Update User Status (Lock/Unlock/Deactivate)
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateUserStatusDto }) => {
      const response = await api.patch<ApiResponse<User>>(`/users/${id}/status`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      const statusLabels = {
        active: "kích hoạt",
        inactive: "vô hiệu hóa",
        locked: "khóa",
      };
      toast.success(`Đã ${statusLabels[variables.data.status]} tài khoản!`);
    },
    onError: (error: any) => {
      toast.error(error.error?.message || "Cập nhật trạng thái thất bại!");
    },
  });
}

// Delete User
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<void>>(`/users/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("Xóa nhân viên thành công!");
    },
    onError: (error: any) => {
      toast.error(error.error?.message || "Xóa nhân viên thất bại!");
    },
  });
}

// Upload User Avatar
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await api.post<ApiResponse<UploadAvatarResponse>>(
        `/users/${id}/avatar`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      toast.success("Tải ảnh đại diện thành công!");
    },
    onError: (error: any) => {
      toast.error(error.error?.message || "Tải ảnh đại diện thất bại!");
    },
  });
}

// Reset/Change User Password (Admin only)
export function useChangeUserPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      const response = await api.put<ApiResponse<{ message: string }>>(
        `/users/${id}/password`,
        { password }
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      toast.success("Cập nhật mật khẩu nhân viên thành công!");
    },
    onError: (error: any) => {
      if(error.error.code === 'VALIDATION_ERROR') {
        for(let i = 0; i < error.error.details.length; i++) {
          toast.error(error.error.details[i].message);
          break;
        }
      }else {
        toast.error(error.error?.message || "Cập nhật mật khẩu thất bại!");
      }
    },
  });
}

// Delete User Avatar
export function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<void>>(`/users/${id}/avatar`);
      return response;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      toast.success("Xóa ảnh đại diện thành công!");
    },
    onError: (error: any) => {
      toast.error(error.error?.message || "Xóa ảnh đại diện thất bại!");
    },
  });
}

// Toggle User Can Edit Profile
export function useToggleCanEditProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, canEditProfile }: { id: number; canEditProfile: boolean }) => {
      const response = await api.patch<ApiResponse<User>>(
        `/users/${id}`,
        { canEditProfile }
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      const text = variables.canEditProfile ? "cho phép" : "tắt";
      toast.success(`${text} chỉnh sửa hồ sơ thành công!`);
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Cập nhật thất bại!");
    },
  });
}

// Get User Activity Logs
export interface ActivityLog {
  id: string;
  action: "create" | "update" | "delete" | "approve";
  tableName: string;
  recordId?: number | null;
  oldValue?: any;
  newValue?: any;
  reason?: string | null;
  status: "success" | "failure";
  createdAt: Date;
}

export interface ActivityLogsResponse {
  data: ActivityLog[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
}

export function useUserActivityLogs(
  userId: number,
  options?: { limit?: number; offset?: number }
) {
  return useQuery({
    queryKey: ["users", userId, "activity-logs", options],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ActivityLogsResponse>>(
        `/users/${userId}/activity-logs`,
        {
          params: {
            limit: options?.limit || 50,
            offset: options?.offset || 0,
          },
        }
      );
      return response;
    },
  });
}
