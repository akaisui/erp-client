"use client";

/**
 * Receipt Status Component
 * Hiển thị trạng thái phiếu thu (approved/pending)
 */

import React from "react";
import type { PaymentReceipt } from "@/types";
import { CheckCircle, Clock, FileCheck } from "lucide-react";

interface ReceiptStatusProps {
  receipt: PaymentReceipt;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const sizeClasses = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-base",
};

export default function ReceiptStatus({
  receipt,
  size = "md",
  showLabel = true,
}: ReceiptStatusProps) {
  const isApproved = !!receipt.approvedAt;
  const isPosted = receipt.isPosted;

  if (isApproved) {
    return (
      <div className="inline-flex items-center gap-2">
        {/* Approved Badge */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 ${sizeClasses[size]}`}
        >
          <CheckCircle className="h-4 w-4" />
          {showLabel && "Đã duyệt"}
        </span>

        {/* Posted Badge */}
        {isPosted && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ${sizeClasses[size]}`}
          >
            <FileCheck className="h-4 w-4" />
            {showLabel && "Đã ghi sổ"}
          </span>
        )}
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 ${sizeClasses[size]}`}
    >
      <Clock className="h-4 w-4" />
      {showLabel && "Chờ duyệt"}
    </span>
  );
}

/**
 * Receipt Type Badge
 * Hiển thị loại phiếu thu
 */
interface ReceiptTypeBadgeProps {
  receiptType: string;
  size?: "sm" | "md" | "lg";
}

export function ReceiptTypeBadge({ receiptType, size = "md" }: ReceiptTypeBadgeProps) {
  const typeConfig: Record<
    string,
    { label: string; color: string }
  > = {
    sales: {
      label: "Thu tiền hàng",
      color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    },
    debt_collection: {
      label: "Thu công nợ",
      color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    },
    refund: {
      label: "Hoàn tiền",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    other: {
      label: "Khác",
      color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
    },
  };

  const config = typeConfig[receiptType] || typeConfig.other;

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.color} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
}

/**
 * Payment Method Badge
 * Hiển thị phương thức thanh toán
 */
interface PaymentMethodBadgeProps {
  paymentMethod: string;
  size?: "sm" | "md" | "lg";
  bankName?: string;
}

export function PaymentMethodBadge({
  paymentMethod,
  size = "md",
  bankName,
}: PaymentMethodBadgeProps) {
  const methodConfig: Record<string, { label: string; emoji: string; color: string }> = {
    cash: {
      label: "Tiền mặt",
      emoji: "💵",
      color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    },
    transfer: {
      label: "Chuyển khoản",
      emoji: "🏦",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    card: {
      label: "Thẻ",
      emoji: "💳",
      color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    },
  };

  const config = methodConfig[paymentMethod] || methodConfig.cash;
  const displayLabel = bankName && paymentMethod === "transfer" ? bankName : "";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.color} ${sizeClasses[size]}`}
    >
      <span className="text-lg">{config.emoji}</span>
      {displayLabel}
    </span>
  );
}
