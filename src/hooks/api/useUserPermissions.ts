import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { ApiResponse, Permission } from "@/types";
import toast from "react-hot-toast";

export interface UserPermission {
  userId: number;
  permissionId: number;
  permissionKey: string;
  permissionName: string;
  grantType: "grant" | "revoke";
  assignedAt: string;
  assignedBy?: {
    id: number;
    fullName: string;
  };
}

export interface EffectivePermissions {
  userId: number;
  rolePermissions: string[];
  userPermissions: {
    permissionKey: string;
    grantType: "grant" | "revoke";
  }[];
  effectivePermissions: string[];
}

// Query Keys
export const userPermissionKeys = {
  all: ["userPermissions"] as const,
  detail: (userId: number) => [...userPermissionKeys.all, "detail", userId] as const,
  effective: (userId: number) => [...userPermissionKeys.all, "effective", userId] as const,
};

// Get User's Direct Permissions
export function useUserPermissions(userId: number, enabled = true) {
  return useQuery({
    queryKey: userPermissionKeys.detail(userId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<UserPermission[]>>(
        `/users/${userId}/permissions`
      );
      return response.data;
    },
    enabled: enabled && !!userId,
  });
}

// Get User's Effective Permissions (role + user-specific)
export function useUserEffectivePermissions(userId: number, enabled = true) {
  return useQuery({
    queryKey: userPermissionKeys.effective(userId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<EffectivePermissions>>(
        `/users/${userId}/permissions/effective`
      );
      return response.data;
    },
    enabled: enabled && !!userId,
  });
}

// Get All Permissions (for assignment UI)
export function useAllPermissions() {
  return useQuery({
    queryKey: ["allPermissions"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>("/permissions");
      const permissions = response.data || [];
      return permissions;
    },
  });
}

// Assign Permission to User
export function useAssignUserPermission(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ permissionId, grantType = "grant" }: { permissionId: number; grantType?: "grant" | "revoke" }) => {
      const response = await api.post<ApiResponse<any>>(
        `/users/${userId}/permissions`,
        { permissionId, grantType }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userPermissionKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userPermissionKeys.effective(userId) });
      toast.success("Gán quyền thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Gán quyền thất bại!");
    },
  });
}

// Revoke Permission from User
export function useRevokeUserPermission(userId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (permissionId: number) => {
      const response = await api.delete<ApiResponse<any>>(
        `/users/${userId}/permissions/${permissionId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userPermissionKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userPermissionKeys.effective(userId) });
      toast.success("Xóa quyền thành công!");
    },
    onError: (error: any) => {
      toast.error(error?.error?.message || "Xóa quyền thất bại!");
    },
  });
}
