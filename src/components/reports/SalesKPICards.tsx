"use client";

import React from "react";
import { TrendingUp, DollarSign, AlertCircle, ShoppingCart } from "lucide-react";
import type { SalesKPISummary } from "@/types/report.types";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface SalesKPICardsProps {
  summary: SalesKPISummary | null;
  isLoading?: boolean;
}

export default function SalesKPICards({ summary, isLoading = false }: SalesKPICardsProps) {
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

  if (!summary) return null;

  const cards = [
    {
      title: "Doanh thu thuần",
      value: formatCurrency(summary.netRevenue),
      trend: summary.netRevenueGrowth,
      trendLabel: "so với kỳ trước",
      icon: DollarSign,
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      trendColor: summary.netRevenueGrowth >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Lợi nhuận ước tính",
      value: formatCurrency(summary.estimatedProfit),
      trend: summary.profitMargin,
      trendLabel: "biên lợi nhuận",
      icon: TrendingUp,
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      trendColor: "text-blue-600",
    },
    {
      title: "Tổng đơn hàng",
      value: formatNumber(summary.totalOrders),
      subValue: `${summary.completedOrders} hoàn tất | ${summary.cancelledOrders} hủy`,
      icon: ShoppingCart,
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Công nợ phát sinh",
      value: formatCurrency(summary.newDebt),
      trend: summary.debtPercentage,
      trendLabel: "% doanh thu",
      icon: AlertCircle,
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
      trendColor: summary.debtPercentage > 30 ? "text-orange-600" : "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            {/* Icon */}
            <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${card.bgColor}`}>
              <Icon className={`h-6 w-6 ${card.iconColor}`} />
            </div>

            {/* Title */}
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{card.title}</p>

            {/* Main Value */}
            <div className="mt-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            </div>

            {/* Sub Value */}
            {card.subValue && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{card.subValue}</p>
            )}

            {/* Trend */}
            {card.trend !== undefined && (
              <div className="mt-3 flex items-center gap-1">
                <TrendingUp className={`h-4 w-4 ${card.trendColor} ${card.trend < 0 ? "rotate-180" : ""}`} />
                <span className={`text-xs font-semibold ${card.trendColor || "text-gray-600"}`}>
                  {Math.abs(card.trend).toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{card.trendLabel}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
