"use client";

/**
 * Promotion Status Component
 * Hiển thị trạng thái, loại và các badge cho promotions
 */

import React from "react";
import type { Promotion, PromotionType, PromotionStatus as StatusType } from "@/types";
import {
  CheckCircle,
  Clock,
  XCircle,
  Ban,
  Percent,
  DollarSign,
  Gift,
  Tag,
  Calendar,
} from "lucide-react";

interface PromotionStatusProps {
  promotion: Promotion;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const sizeClasses = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-base",
};

export default function PromotionStatus({
  promotion,
  size = "md",
  showLabel = true,
}: PromotionStatusProps) {
  const status = promotion.status;

  const statusConfig: Record<
    StatusType,
    { label: string; icon: React.ReactNode; color: string }
  > = {
    pending: {
      label: "Chờ duyệt",
      icon: <Clock className="h-4 w-4" />,
      color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    },
    active: {
      label: "Đang hoạt động",
      icon: <CheckCircle className="h-4 w-4" />,
      color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    },
    expired: {
      label: "Đã hết hạn",
      icon: <XCircle className="h-4 w-4" />,
      color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
    },
    cancelled: {
      label: "Đã hủy",
      icon: <Ban className="h-4 w-4" />,
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.color} ${sizeClasses[size]}`}
    >
      {config.icon}
      {showLabel && config.label}
    </span>
  );
}

/**
 * Promotion Type Badge
 * Hiển thị loại khuyến mãi
 */
interface PromotionTypeBadgeProps {
  promotionType: PromotionType;
  size?: "sm" | "md" | "lg";
}

export function PromotionTypeBadge({
  promotionType,
  size = "md",
}: PromotionTypeBadgeProps) {
  const typeConfig: Record<
    PromotionType,
    { label: string; icon: React.ReactNode; color: string }
  > = {
    percent_discount: {
      label: "Giảm %",
      icon: <Percent className="h-3 w-3" />,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    fixed_discount: {
      label: "Giảm cố định",
      icon: <DollarSign className="h-3 w-3" />,
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    },
    buy_x_get_y: {
      label: "Mua X tặng Y",
      icon: <Gift className="h-3 w-3" />,
      color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    },
    gift: {
      label: "Tặng quà",
      icon: <Tag className="h-3 w-3" />,
      color:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    },
  };

  const config = typeConfig[promotionType];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.color} ${sizeClasses[size]}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

/**
 * Discount Value Display
 * Hiển thị giá trị giảm giá
 */
interface DiscountValueDisplayProps {
  promotion: Promotion;
  size?: "sm" | "md" | "lg";
}

export function DiscountValueDisplay({
  promotion,
  size = "md",
}: DiscountValueDisplayProps) {
  const { promotionType, discountValue, maxDiscountValue } = promotion;

  let displayValue = "";

  switch (promotionType) {
    case "percent_discount":
      displayValue = `${discountValue}%`;
      if (maxDiscountValue) {
        displayValue += ` (max ${maxDiscountValue.toLocaleString()}đ)`;
      }
      break;
    case "fixed_discount":
      displayValue = `${discountValue.toLocaleString()}đ`;
      break;
    case "buy_x_get_y":
      displayValue = `Mua ${promotion.conditions?.buyQuantity || "X"} tặng ${promotion.conditions?.getQuantity || "Y"}`;
      break;
    case "gift":
      displayValue = "Tặng quà";
      break;
  }

  const textSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <span
      className={`${textSize[size]} font-semibold text-red-600 dark:text-red-400`}
    >
      {displayValue}
    </span>
  );
}

/**
 * Date Range Display
 * Hiển thị thời gian hiệu lực
 */
interface DateRangeDisplayProps {
  startDate: string;
  endDate: string;
  size?: "sm" | "md" | "lg";
  isRecurring?: boolean;
}

export function DateRangeDisplay({
  startDate,
  endDate,
  size = "md",
  isRecurring = false,
}: DateRangeDisplayProps) {
  const textSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className={`flex items-center gap-2 ${textSize[size]} text-gray-600 dark:text-gray-400`}>
      <Calendar className="h-4 w-4" />
      <span>
        {formatDate(startDate)} - {formatDate(endDate)}
      </span>
      {isRecurring && (
        <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
          Lặp lại
        </span>
      )}
    </div>
  );
}

/**
 * Usage Progress Bar
 * Hiển thị tiến độ sử dụng
 */
interface UsageProgressBarProps {
  usageCount: number;
  quantityLimit?: number;
  size?: "sm" | "md" | "lg";
}

export function UsageProgressBar({
  usageCount,
  quantityLimit,
  size = "md",
}: UsageProgressBarProps) {
  if (!quantityLimit) {
    return (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Đã sử dụng: <span className="font-semibold">{usageCount}</span> lần
      </div>
    );
  }

  const percentage = Math.min((usageCount / quantityLimit) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  const heightClass = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>
          Đã sử dụng: <span className="font-semibold">{usageCount}</span> /{" "}
          {quantityLimit}
        </span>
        <span className={isAtLimit ? "text-red-600" : isNearLimit ? "text-orange-600" : ""}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      <div className={`w-full rounded-full bg-gray-200 dark:bg-gray-700 ${heightClass[size]}`}>
        <div
          className={`rounded-full transition-all ${
            isAtLimit
              ? "bg-red-600"
              : isNearLimit
                ? "bg-orange-500"
                : "bg-green-500"
          } ${heightClass[size]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}