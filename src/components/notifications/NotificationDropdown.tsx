"use client";

import React from "react";
import Link from "next/link";
import {
  useUnreadNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from "@/hooks/api/useNotifications";
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_COLORS,
  formatRelativeTime,
  getNotificationLink,
} from "@/types/notification.types";
import type { Notification } from "@/types/notification.types";
import {
  Check,
  Trash2,
  BellOff,
  ArrowRight,
  Info,
  Archive,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  CheckCircle,
  Bell,
  Megaphone,
} from "lucide-react";

export interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const getIcon = (type: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    system: <Info className="w-5 h-5" />,
    low_stock: <Archive className="w-5 h-5" />,
    expiry_warning: <AlertTriangle className="w-5 h-5" />,
    debt_overdue: <DollarSign className="w-5 h-5" />,
    order_new: <ShoppingCart className="w-5 h-5" />,
    approval_required: <CheckCircle className="w-5 h-5" />,
    reminder: <Bell className="w-5 h-5" />,
    announcement: <Megaphone className="w-5 h-5" />,
  };
  return iconMap[type] || <Info className="w-5 h-5" />;
};

export default function NotificationDropdown({
  isOpen,
  onClose,
}: NotificationDropdownProps) {
  const { data: notificationsData, isLoading } = useUnreadNotifications();
  console.log('notificationsData', notificationsData)
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = notificationsData?.data || [];

  const handleMarkAsRead = async (
    e: React.MouseEvent,
    id: string | number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    await markAsRead.mutateAsync(id);
  };

  const handleDelete = async (e: React.MouseEvent, id: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Xác nhận xóa thông báo này?")) {
      await deleteNotification.mutateAsync(id);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync();
  };



  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Thông báo
        </h3>
        {(notifications as any).length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (notifications as any).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BellOff className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Không có thông báo mới
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {(notifications as any).map((notification: Notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {(notifications as any).length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/notifications"
            onClick={onClose}
            className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            Xem tất cả thông báo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

//----------------------------------------------
// NotificationItem Component
//----------------------------------------------

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (e: React.MouseEvent, id: string | number) => void;
  onDelete: (e: React.MouseEvent, id: string | number) => void;
  onClose: () => void;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClose,
}: NotificationItemProps) {
  const colors = NOTIFICATION_TYPE_COLORS[notification.notificationType] || NOTIFICATION_TYPE_COLORS.system;
  const link = getNotificationLink(notification);

  const content = (
    <div
      className={`group px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
        !notification.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 p-2 rounded-lg ${colors.bg} ${colors.icon}`}
        >
          {getIcon(notification.notificationType)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title & Type */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
              {notification.title}
            </h4>
            {!notification.isRead && (
              <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
            )}
          </div>

          {/* Message */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
            {notification.message}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2">
            {/* Time & Type */}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatRelativeTime(notification.createdAt)}</span>
              <span>•</span>
              <span className={colors.text}>
                {NOTIFICATION_TYPE_LABELS[notification.notificationType]}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.isRead && (
                <button
                  onClick={(e) => onMarkAsRead(e, notification.id)}
                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/30"
                  title="Đánh dấu đã đọc"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => onDelete(e, notification.id)}
                className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                title="Xóa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href={link} onClick={onClose} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
