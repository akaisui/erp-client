import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types/common.types";
import type {
  Notification,
  NotificationFilters,
  UnreadCountResponse,
  CreateNotificationDto,
  BroadcastNotificationDto,
} from "@/types/notification.types";

//----------------------------------------------
// Query Keys
//----------------------------------------------
export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (filters?: NotificationFilters) =>
    [...notificationKeys.lists(), filters] as const,
  unread: () => [...notificationKeys.all, "unread"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
  details: () => [...notificationKeys.all, "detail"] as const,
  detail: (id: string | number) => [...notificationKeys.details(), id] as const,
};

//----------------------------------------------
// Query Hooks
//----------------------------------------------
// Get all notifications with filters
export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: async () => {
      const response = await api.get<
        ApiResponse<PaginatedResponse<Notification>>
      >("/notifications", { params: filters });
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Get unread notifications
export function useUnreadNotifications() {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: async () => {
      const response = await api.get<
        ApiResponse<PaginatedResponse<Notification>>
      >("/notifications/unread");
      return response;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Get unread count
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<UnreadCountResponse>>(
        "/notifications/unread-count"
      );
      return response.data;
    },
    refetchInterval: 15000, // Refetch every 15 seconds
  });
}

// Get notification by ID
export function useNotificationDetail(id: string | number) {
  return useQuery({
    queryKey: notificationKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<ApiResponse<Notification>>(
        `/notifications/${id}`
      );
      return response.data;
    },
    enabled: !!id,
  });
}

//----------------------------------------------
// Mutation Hooks
//----------------------------------------------
// Create notification (admin only)
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateNotificationDto) => {
      const response = await api.post<ApiResponse<Notification>>(
        "/notifications",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      toast.success("Tạo thông báo thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Tạo thông báo thất bại!"
      );
    },
  });
}

// Broadcast notification to multiple users or role (admin only)
export function useBroadcastNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BroadcastNotificationDto) => {
      const response = await api.post<ApiResponse<Notification[]>>(
        "/notifications/broadcast",
        data
      );
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      const count = Array.isArray(response.data) ? response.data.length : 0;
      toast.success(`Đã gửi thông báo đến ${count} người dùng!`);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Gửi thông báo thất bại!"
      );
    },
  });
}

// Mark notification as read
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      const response = await api.put<ApiResponse<Notification>>(
        `/notifications/${id}/read`
      );
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
      queryClient.invalidateQueries({ queryKey: notificationKeys.detail(id) });
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message ||
          "Đánh dấu đã đọc thất bại!"
      );
    },
  });
}

// Mark all notifications as read
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.put<ApiResponse<{ count: number }>>(
        "/notifications/read-all"
      );
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
      const count = response.data?.count || 0;
      toast.success(`Đã đánh dấu ${count} thông báo là đã đọc!`);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message ||
          "Đánh dấu tất cả đã đọc thất bại!"
      );
    },
  });
}

// Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      const response = await api.delete<ApiResponse<{ message: string }>>(
        `/notifications/${id}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
      toast.success("Xóa thông báo thành công!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Xóa thông báo thất bại!"
      );
    },
  });
}

// Delete all read notifications
export function useDeleteAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.delete<ApiResponse<{ count: number }>>(
        "/notifications/read"
      );
      return response.data;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.unreadCount(),
      });
      const count = response.data?.count || 0;
      toast.success(`Đã xóa ${count} thông báo đã đọc!`);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message ||
          "Xóa thông báo đã đọc thất bại!"
      );
    },
  });
}
