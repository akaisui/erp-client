import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { ApiResponse, Role, Permission, PaginationParams } from "@/types";
import toast from "react-hot-toast";
import type { CreateRoleFormData, UpdateRoleFormData } from "@/lib/validations";

// Role Filters
export interface RoleFilters {
  status?: "active" | "inactive";
}

// Query Keys
export const roleKeys = {
  all: ["roles"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
  list: (filters?: RoleFilters) => [...roleKeys.lists(), filters] as const,
  details: () => [...roleKeys.all, "detail"] as const,
  detail: (id: number) => [...roleKeys.details(), id] as const,
  permissions: () => [...roleKeys.all, "permissions"] as const,
  permission: (id: number) => [...roleKeys.permissions(), id] as const,
};

// Get Roles List
export function useRoles(filters?: RoleFilters & PaginationParams) {
  return useQuery({
    queryKey: roleKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/roles", {
        params: filters,
      });
      return response;
    },
  });
}

// Get Single Role
export function useRole(id: number, enabled = true) {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Role>>(`/roles/${id}`);
      return response;
    },
    enabled: enabled && !!id,
  });
}

// Get Role Permissions
export function useRolePermissions(roleId: number, enabled = true) {
  return useQuery({
    queryKey: roleKeys.permission(roleId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/roles/${roleId}/permissions`);
      return response;
    },
    enabled: enabled && !!roleId,
  });
}

// Get All Permissions
export function useApiPermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Permission[]>>("/permissions");
      return response;
    },
  });
}

// Create Role
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRoleFormData) => {
      const response = await api.post<ApiResponse<Role>>("/roles", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      toast.success("Tạo vai trò thành công!");
    },
    onError: (error: any) => {
      toast.error(error.error?.message || "Lỗi tạo vai trò!");
    },
  });
}

// Update Role
export function useUpdateRole(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateRoleFormData) => {
      const response = await api.put<ApiResponse<Role>>(`/roles/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      toast.success("Cập nhật vai trò thành công!");
    },
    onError: (error: any) => {
      toast.error(error.error?.message  || "Cập nhật vai trò thất bại");
    },
  });
}

// Delete Role
export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<ApiResponse<any>>(`/roles/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      toast.success("Xóa vai trò thành công!");
    },
    onError: (error: any) => {
      toast.error(error.error?.message  || "Xóa vai trò thất bại");
    },
  });
}

// Assign Permissions to Role
export function useAssignPermissions(roleId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (permissionIds: number[]) => {
      const response = await api.put<ApiResponse<any>>(
        `/roles/${roleId}/permissions`,
        { permissionIds }
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.permission(roleId) });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(roleId) });
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      toast.success("Quyền được cấp thành công");
    },
    onError: (error: any) => {
      toast.error(error.error?.messagee || "Lỗi khi cấp quyền!");
    },
  });
}

// Add Single Permission to Role
export function useAddPermission(roleId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (permissionId: number) => {
      const response = await api.post<ApiResponse<any>>(
        `/roles/${roleId}/permissions/${permissionId}`
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.permission(roleId) });
      toast.success("Đã thêm quyền thành công");
    },
    onError: (error: any) => {
      toast.error(error.error?.message || "Không thể thêm quyền");
    },
  });
}

// Remove Permission from Role
export function useRemovePermission(roleId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (permissionId: number) => {
      const response = await api.delete<ApiResponse<any>>(
        `/roles/${roleId}/permissions/${permissionId}`
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.permission(roleId) });
      toast.success("Đã xóa quyền thành công");
    },
    onError: (error: any) => {
      toast.error(error.error?.message || "Không thể xóa quyền");
    },
  });
}
