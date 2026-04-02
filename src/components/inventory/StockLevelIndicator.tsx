import React from "react";
import { clsx } from "clsx";

interface StockLevelIndicatorProps {
  current: number;
  min: number;
  reserved?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StockLevelIndicator({
  current,
  min,
  reserved = 0,
  showLabel = true,
  size = "md",
}: StockLevelIndicatorProps) {
  const available = current - reserved;
  const percentage = min > 0 ? (available / min) * 100 : 100;

  // Determine color based on stock level
  const getColor = () => {
    if (percentage >= 100) return "green";
    if (percentage >= 50) return "yellow";
    if (percentage >= 25) return "orange";
    return "red";
  };

  const color = getColor();

  // Color classes
  const colorClasses = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
  };

  const textColorClasses = {
    green: "text-green-700 dark:text-green-400",
    yellow: "text-yellow-700 dark:text-yellow-400",
    orange: "text-orange-700 dark:text-orange-400",
    red: "text-red-700 dark:text-red-400",
  };

  // Size classes
  const sizeClasses = {
    sm: "h-1 w-16",
    md: "h-2 w-24",
    lg: "h-3 w-32",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex items-center gap-2">
      {/* Progress Bar */}
      <div
        className={clsx(
          "rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700",
          sizeClasses[size]
        )}
      >
        <div
          className={clsx(
            "h-full transition-all duration-300",
            colorClasses[color]
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Label */}
      {showLabel && (
        <div className={clsx("font-medium whitespace-nowrap", textSizeClasses[size], textColorClasses[color])}>
          <span className="font-semibold">{available}</span>
          <span className="text-gray-500 dark:text-gray-400"> / {min}</span>
          {reserved > 0 && (
            <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">
              ({reserved} đặt)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function StockStatusBadge({ current, min }: { current: number; min: number }) {
  const percentage = min > 0 ? (current / min) * 100 : 100;

  let label = "";
  let colorClass = "";

  if (current === 0) {
    label = "Hết hàng";
    colorClass = "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
  } else if (percentage < 25) {
    label = "Sắp hết";
    colorClass = "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
  } else if (percentage < 50) {
    label = "Tồn thấp";
    colorClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
  } else if (percentage < 100) {
    label = "Tồn vừa";
    colorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
  } else {
    label = "Đủ hàng";
    colorClass = "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        colorClass
      )}
    >
      {label}
    </span>
  );
}
