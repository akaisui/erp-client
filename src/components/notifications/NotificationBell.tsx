"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUnreadCount } from "@/hooks/api/useNotifications";
import { onEvent, offEvent } from "@/lib/socket";
import NotificationDropdown from "./NotificationDropdown";
import { Bell } from "lucide-react";
import type { Notification } from "@/types/notification.types";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: unreadCountData, refetch: refetchUnreadCount } =
    useUnreadCount();
  const unreadCount = (unreadCountData as any)?.count || 0;

  // Handle Socket.IO real-time notifications
  useEffect(() => {
    const handleNotification = (data: { notification: Notification }) => {
      // Trigger animation
      setHasNewNotification(true);
      setTimeout(() => setHasNewNotification(false), 3000);

      // Refetch unread count
      refetchUnreadCount();
    };

    onEvent("notification", handleNotification);

    return () => {
      offEvent("notification", handleNotification);
    };
  }, [refetchUnreadCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setHasNewNotification(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        {/* Bell Icon */}
        {hasNewNotification ? (
          <Bell
            className="w-6 h-6 animate-bounce text-blue-600 dark:text-blue-400"
            aria-hidden="true"
          />
        ) : (
          <Bell className="w-6 h-6" aria-hidden="true" />
        )}

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-semibold rounded-full ring-2 ring-white dark:ring-gray-800">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* Pulse animation for new notifications */}
        {hasNewNotification && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <NotificationDropdown
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
