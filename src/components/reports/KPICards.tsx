"use client";

import React from "react";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Percent, AlertCircle } from "lucide-react";
import { formatPercentage } from "@/types/report.types";
import type { RevenueReport } from "@/types/report.types";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface KPICardsProps {
  data: RevenueReport | null;
  isLoading?: boolean;
}

export default function KPICards({ data, isLoading = false }: KPICardsProps) {
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

  if (!data) return null;

  const { summary } = data;

  // Extract values from summary (all properties are guaranteed to exist)
  const grossRevenue = Number(summary.grossRevenue || 0);
  const totalDiscount = Number(summary.totalDiscount || 0);
  const netRevenue = Number(summary.netRevenue || 0);
  const paidAmount = Number(summary.paidAmount || 0);
  const totalOrders = Number(summary.totalOrders || 0);
  const debtAmount = Number(summary.debtAmount || 0);

  const averageOrder = totalOrders > 0 ? netRevenue / totalOrders : 0;
  const paidPct = netRevenue > 0 ? (paidAmount / netRevenue) * 100 : 0;
  const discountPct = grossRevenue > 0 ? (totalDiscount / grossRevenue) * 100 : 0;
  const debtPct = netRevenue > 0 ? (debtAmount / netRevenue) * 100 : 0;

  const cards = [
    {
      title: "Tổng Doanh Thu",
      value: formatCurrency(grossRevenue),
      icon: DollarSign,
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Thực Thu",
      value: formatCurrency(netRevenue),
      icon: ShoppingCart,
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Lợi Nhuận",
      value: formatCurrency(paidAmount),
      icon: TrendingUp,
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      subText: `${formatPercentage(paidPct)} đã thanh toán`,
    },
    {
      title: "Tổng Đơn Hàng",
      value: formatNumber(totalOrders),
      icon: ShoppingCart,
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      subText: `${formatCurrency(averageOrder)}/đơn trung bình`,
    },
    {
      title: "Tiền Chiết Khấu",
      value: formatCurrency(totalDiscount),
      icon: Percent,
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-400",
      subText: `${formatPercentage(discountPct)} doanh thu`,
    },
    {
      title: "Công Nợ Phải Thu",
      value: formatCurrency(debtAmount),
      icon: AlertCircle,
      bgColor: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
      subText: `${formatPercentage(debtPct)} chưa thu`,
    },
  ];


  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-start justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${card.bgColor}`}>
                <Icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
              {summary && typeof summary.growth === 'number' && summary.growth !== 0 && index === 0 && (
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    summary.growth > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {summary.growth > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {formatPercentage(Math.abs(summary.growth))}
                </div>
              )}
            </div>
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{card.value}</p>
              {card.subText && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{card.subText}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
