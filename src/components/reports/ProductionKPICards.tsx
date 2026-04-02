"use client";

import React from "react";
import { Package, TrendingUp, DollarSign, AlertCircle } from "lucide-react";
import { formatPercentage } from "@/types/report.types";
import type { ProductionReport } from "@/types/report.types";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface ProductionKPICardsProps {
  data: ProductionReport | null;
  isLoading?: boolean;
}

export default function ProductionKPICards({ data, isLoading = false }: ProductionKPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700"
          />
        ))}
      </div>
    );
  }

  if (!data || !data.summary) return null;

  const { summary } = data;

  // Calculate progress for visual indicators
  const completionColor =
    (summary?.completionPercentage || 0) >= 100
      ? "text-green-600 dark:text-green-400"
      : (summary?.completionPercentage || 0) >= 80
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-red-600 dark:text-red-400";

  const wastageColor = (summary?.wastageRate || 0) > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400";

  // Calculate on-time delivery color
  const onTimeColor =
    (summary?.onTimeDeliveryRate || 0) >= 95
      ? "text-green-600 dark:text-green-400"
      : (summary?.onTimeDeliveryRate || 0) >= 85
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* KPI 1: Tiến độ - Sản lượng hoàn thành */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30`}>
            <Package className={`h-6 w-6 text-blue-600 dark:text-blue-400`} />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Sản lượng hoàn thành</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className={`text-2xl font-bold ${completionColor}`}>{formatNumber(summary.outputVolume)}</p>
            <span className="text-xs text-gray-500">/ {formatNumber(summary.plannedVolume)}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full transition-all ${
                summary.completionPercentage >= 100
                  ? "bg-green-500"
                  : summary.completionPercentage >= 80
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${Math.min(summary.completionPercentage, 100)}%` }}
            />
          </div>
          <p className={`mt-1 text-xs font-medium ${completionColor}`}>
            {formatPercentage(Math.min(summary.completionPercentage, 100))}
          </p>
        </div>
      </div>

      {/* KPI 2: Hiệu suất - Tỷ lệ hao hụt */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30`}>
            <AlertCircle className={`h-6 w-6 text-orange-600 dark:text-orange-400`} />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Tỷ lệ hao hụt nguyên liệu</p>
          <p className={`mt-2 text-2xl font-bold ${wastageColor}`}>{formatPercentage(summary.wastageRate)}</p>
          <p className="mt-1 text-xs text-gray-500">Chi phí: {formatCurrency(summary.wastageValue)}</p>
          <p className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">
            {summary.wastageRate === 0 ? "✅ Không có hao hụt" : "⚠️ Cảnh báo hao hụt"}
          </p>
        </div>
      </div>

      {/* KPI 3: Chi phí - Tổng chi phí sản xuất */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30`}>
            <DollarSign className={`h-6 w-6 text-purple-600 dark:text-purple-400`} />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Tổng chi phí sản xuất</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(summary.totalProductionCost)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {formatCurrency(summary.costPerUnit)}/đơn vị
          </p>
        </div>
      </div>

      {/* KPI 4: Hiệu suất vận hành - Tỷ lệ đúng hạn */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
            summary.onTimeDeliveryRate >= 95 ? "bg-green-100 dark:bg-green-900/30" : 
            summary.onTimeDeliveryRate >= 85 ? "bg-yellow-100 dark:bg-yellow-900/30" : 
            "bg-red-100 dark:bg-red-900/30"
          }`}>
            <TrendingUp className={`h-6 w-6 ${onTimeColor}`} />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Hiệu suất vận hành</p>
          <p className={`mt-2 text-2xl font-bold ${onTimeColor}`}>
            {formatPercentage(summary.onTimeDeliveryRate)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {summary.completedOnTime}/{summary.totalCompleted} lệnh đúng hạn
          </p>
          {summary.onTimeDeliveryRate < 85 && (
            <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">⚠️ Dưới mục tiêu 95%</p>
          )}
        </div>
      </div>
    </div>
  );
}
