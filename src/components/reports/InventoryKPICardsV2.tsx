"use client";

import React from "react";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  AlertCircle,
  Lock,
  Zap,
} from "lucide-react";

interface KPICard {
  title: string;
  value: string | number;
  subText?: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  status?: "normal" | "warning" | "danger";
}

interface InventoryKPICardsProps {
  totalValue: number;
  totalSKUs: number;
  lowStockCount: number;
  outOfStockCount: number;
  reservedQuantity: number;
  capacityUsage: number; // 0-100 percentage
  isLoading?: boolean;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export default function InventoryKPICards({
  totalValue,
  totalSKUs,
  lowStockCount,
  outOfStockCount,
  reservedQuantity,
  capacityUsage,
  isLoading = false,
}: InventoryKPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700"
          />
        ))}
      </div>
    );
  }

  const kpiCards: KPICard[] = [
    {
      title: "Tổng Giá Trị Kho",
      value: formatCurrency(totalValue),
      icon: <Package className="h-6 w-6" />,
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      status: "normal",
    },
    {
      title: "Tổng SKU",
      value: formatNumber(totalSKUs),
      subText: "sản phẩm",
      icon: <Zap className="h-6 w-6" />,
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      status: "normal",
    },
    {
      title: "Tồn Kho Thấp",
      value: lowStockCount,
      subText: "cảnh báo",
      icon: <TrendingDown className="h-6 w-6" />,
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      status: lowStockCount > 0 ? "warning" : "normal",
    },
    {
      title: "Hết Hàng",
      value: outOfStockCount,
      subText: "sản phẩm",
      icon: <AlertCircle className="h-6 w-6" />,
      bgColor: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
      status: outOfStockCount > 0 ? "danger" : "normal",
    },
    {
      title: "Đang Giữ (Reserved)",
      value: formatNumber(reservedQuantity),
      subText: "đơn vị",
      icon: <Lock className="h-6 w-6" />,
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      status: "normal",
    },
    {
      title: "Sử Dụng Kho",
      value: `${capacityUsage.toFixed(1)}%`,
      subText: "năng lực",
      icon: <Package className="h-6 w-6" />,
      bgColor: capacityUsage > 80 ? "bg-orange-100 dark:bg-orange-900/30" : "bg-indigo-100 dark:bg-indigo-900/30",
      iconColor: capacityUsage > 80 ? "text-orange-600 dark:text-orange-400" : "text-indigo-600 dark:text-indigo-400",
      status: capacityUsage > 90 ? "danger" : capacityUsage > 80 ? "warning" : "normal",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
      {kpiCards.map((card, index) => (
        <div
          key={index}
          className={`rounded-lg border bg-white p-4 shadow-sm dark:bg-gray-800 ${
            card.status === "danger"
              ? "border-red-200 dark:border-red-800"
              : card.status === "warning"
                ? "border-yellow-200 dark:border-yellow-800"
                : "border-gray-200 dark:border-gray-700"
          }`}
        >
          {/* Header with Icon */}
          <div className="flex items-start justify-between mb-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${card.bgColor}`}>
              <span className={card.iconColor}>{card.icon}</span>
            </div>
            {card.status === "danger" && (
              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                ⚠️ Critical
              </span>
            )}
            {card.status === "warning" && (
              <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                ⚡ Alert
              </span>
            )}
          </div>

          {/* Content */}
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {card.title}
            </p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
              {card.value}
            </p>
            {card.subText && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {card.subText}
              </p>
            )}
          </div>

          {/* Trend (Optional) */}
          {card.trend && (
            <div className="mt-3 flex items-center gap-1">
              <span className={`text-xs font-semibold ${
                card.trend.direction === "up" ? "text-green-600" : "text-red-600"
              }`}>
                {card.trend.direction === "up" ? "↑" : "↓"} {card.trend.value}%
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
