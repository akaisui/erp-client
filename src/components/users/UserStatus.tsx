import React from "react";
import Badge from "@/components/ui/badge/Badge";
import type { UserStatus, Gender } from "@/types";
import { UserCheck, UserX, Lock } from "lucide-react";

// User Status Badge Colors
const STATUS_COLORS: Record<UserStatus, "green" | "gray" | "red"> = {
  active: "green",
  inactive: "gray",
  locked: "red",
};

// User Status Labels
const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Hoạt động",
  inactive: "Ngưng hoạt động",
  locked: "Bị khóa",
};

// Gender Labels
const GENDER_LABELS: Record<Gender, string> = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
};

// Props for UserStatusBadge
interface UserStatusBadgeProps {
  status: UserStatus;
  showIcon?: boolean;
}

// User Status Badge Component
export default function UserStatusBadge({ status, showIcon = false }: UserStatusBadgeProps) {
  const StatusIcon = {
    active: UserCheck,
    inactive: UserX,
    locked: Lock,
  }[status];

  return (
    <Badge color={STATUS_COLORS[status]}>
      {showIcon && <StatusIcon className="mr-1 h-3 w-3" />}
      {STATUS_LABELS[status]}
    </Badge>
  );
}

// Gender Display Component
interface GenderDisplayProps {
  gender?: Gender;
}

export function GenderDisplay({ gender }: GenderDisplayProps) {
  if (!gender) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  const icons: Record<Gender, string> = {
    male: "♂",
    female: "♀",
    other: "⚧",
  };

  const colors: Record<Gender, string> = {
    male: "text-blue-600 dark:text-blue-400",
    female: "text-pink-600 dark:text-pink-400",
    other: "text-purple-600 dark:text-purple-400",
  };

  return (
    <span className={`inline-flex items-center gap-1 ${colors[gender]}`}>
      <span>{icons[gender]}</span>
      <span>{GENDER_LABELS[gender]}</span>
    </span>
  );
}

// User Avatar Component
interface UserAvatarProps {
  avatarUrl?: string;
  fullName: string;
  size?: "sm" | "md" | "lg" | "xl";
  showOnlineStatus?: boolean;
  isOnline?: boolean;
}

export function UserAvatar({
  avatarUrl,
  fullName,
  size = "md",
  showOnlineStatus = false,
  isOnline = false,
}: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };

  const onlineIndicatorSize = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
    xl: "h-4 w-4",
  };

  // Get initials safely
  const getInitials = () => {
    if (!fullName || fullName.trim() === "") {
      return "?";
    }
    return fullName.charAt(0).toUpperCase();
  };

  return (
    <div className="relative inline-block">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={fullName || "User"}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-blue-100 font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400`}
        >
          {getInitials()}
        </div>
      )}

      {showOnlineStatus && (
        <span
          className={`absolute bottom-0 right-0 ${onlineIndicatorSize[size]} rounded-full border-2 border-white dark:border-gray-800 ${
            isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
          title={isOnline ? "Đang online" : "Offline"}
        />
      )}
    </div>
  );
}

// User Info Display Component
interface UserInfoDisplayProps {
  user: {
    fullName: string;
    email: string;
    avatarUrl?: string;
    employeeCode?: string;
  };
  showEmail?: boolean;
  showEmployeeCode?: boolean;
}

export function UserInfoDisplay({
  user,
  showEmail = true,
  showEmployeeCode = false,
}: UserInfoDisplayProps) {
  return (
    <div className="flex items-center gap-3">
      <UserAvatar avatarUrl={user.avatarUrl} fullName={user.fullName} size="md" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-gray-900 dark:text-white">
          {user.fullName}
        </div>
        {(showEmail || showEmployeeCode) && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {showEmployeeCode && user.employeeCode && (
              <span className="truncate">{user.employeeCode}</span>
            )}
            {showEmail && showEmployeeCode && user.employeeCode && <span>•</span>}
            {showEmail && <span className="truncate">{user.email}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// Last Login Display
interface LastLoginDisplayProps {
  lastLogin?: string;
}

export function LastLoginDisplay({ lastLogin }: LastLoginDisplayProps) {
  if (!lastLogin) {
    return <span className="text-gray-400 dark:text-gray-500">Chưa đăng nhập</span>;
  }

  const date = new Date(lastLogin);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let timeAgo = "";
  if (diffMins < 1) {
    timeAgo = "Vừa xong";
  } else if (diffMins < 60) {
    timeAgo = `${diffMins} phút trước`;
  } else if (diffHours < 24) {
    timeAgo = `${diffHours} giờ trước`;
  } else if (diffDays < 7) {
    timeAgo = `${diffDays} ngày trước`;
  } else {
    timeAgo = date.toLocaleDateString("vi-VN");
  }

  return (
    <span className="text-sm text-gray-600 dark:text-gray-400" title={date.toLocaleString("vi-VN")}>
      {timeAgo}
    </span>
  );
}
