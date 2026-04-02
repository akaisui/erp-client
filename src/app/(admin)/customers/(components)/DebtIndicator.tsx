"use client";

import React from "react";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DebtIndicatorProps {
  currentDebt: number;
  creditLimit: number;
  showLabel?: boolean;
  showWarning?: boolean;
  size?: "sm" | "md" | "lg";
}

export function DebtIndicator({
  currentDebt,
  creditLimit,
  showLabel = true,
  showWarning = true,
  size = "md",
}: DebtIndicatorProps) {
  // SỬA: Xử lý logic khi hạn mức = 0
  let percentage = 0;
  if (creditLimit > 0) {
    percentage = (currentDebt / creditLimit) * 100;
  } else if (currentDebt > 0) {
    // Nếu hạn mức 0 mà có nợ -> coi như 100% (Vượt mức)
    percentage = 100; 
  }

  const availableCredit = Math.max(0, creditLimit - currentDebt);

  // Determine color based on percentage
  const getColorClass = () => {
    if (percentage >= 100) return "bg-red-600 dark:bg-red-500";
    if (percentage >= 80) return "bg-yellow-500 dark:bg-yellow-400";
    return "bg-green-500 dark:bg-green-400";
  };

  // Determine status
  const getStatus = () => {
    if (percentage >= 100) return "over_limit";
    if (percentage >= 80) return "warning";
    return "safe";
  };

  const status = getStatus();

  // Height based on size
  const heightClass = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  }[size];

  return (
    <div className="space-y-2">
      {/* Label */}
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Công nợ
          </span>
          <span className="text-gray-900 dark:text-white">
            {formatCurrency(currentDebt)} / {formatCurrency(creditLimit)}
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`${heightClass} rounded-full transition-all duration-300 ${getColorClass()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Details */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">
          {creditLimit > 0 ? `${percentage.toFixed(1)}% đã sử dụng` : (currentDebt > 0 ? "Vượt quá hạn mức" : "0% đã sử dụng")}
        </span>
        <span className="font-medium text-gray-900 dark:text-white">
          Còn: {formatCurrency(availableCredit)}
        </span>
      </div>

      {/* Warning Messages */}
      {showWarning && (
        <>
          {status === "over_limit" && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                  Vượt hạn mức
                </p>
                <p className="text-xs text-red-800 dark:text-red-300">
                  Khách hàng đã vượt hạn mức công nợ. Không thể bán hàng thêm.
                </p>
              </div>
            </div>
          )}

          {status === "warning" && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
              <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
                  Gần đạt hạn mức
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  Công nợ đã vượt 80% hạn mức. Cần theo dõi và thu hồi công nợ.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Debt Status Badge - Mini version for tables
export function DebtStatusBadge({ currentDebt, creditLimit }: { currentDebt: number; creditLimit: number }) {
  // Nếu hạn mức = 0, khách hàng không được phép nợ
  if (creditLimit === 0) {
    if (currentDebt > 0) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Vượt hạn
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
        An toàn
      </span>
    );
  }

  const percentage = (currentDebt / creditLimit) * 100;

  const getBadgeClass = () => {
    if (percentage >= 100) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    if (percentage >= 80) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  };

  const getLabel = () => {
    if (percentage >= 100) return "Vượt hạn";
    if (percentage >= 80) return "Cảnh báo";
    return "An toàn";
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getBadgeClass()}`}>
      {getLabel()}
    </span>
  );
}