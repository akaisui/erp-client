"use client";

import React from "react";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { formatPercentage, type FinancialReport } from "@/types/report.types";
import { formatCurrency } from "@/lib/utils";

interface FinancialKPICardsProps {
  data: FinancialReport;
  isLoading?: boolean;
}

export default function FinancialKPICards({
  data,
  isLoading = false,
}: FinancialKPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-lg border border-gray-200 bg-gray-50 animate-pulse dark:border-gray-700 dark:bg-gray-800"
          />
        ))}
      </div>
    );
  }

  const kpi = data?.kpi;
  if (!kpi) return null;

  const cards = [
    {
      title: "Doanh Thu Thuần",
      value: kpi.totalReceipts,
      growth: kpi.receiptGrowth,
      icon: "💰",
      color: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
      textColor: "text-green-600 dark:text-green-400",
      badgeBg: "bg-green-100 dark:bg-green-900",
    },
    {
      title: "Tổng Chi Phí",
      value: kpi.totalPayments,
      growth: kpi.paymentGrowth,
      icon: "💸",
      color: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
      textColor: "text-red-600 dark:text-red-400",
      badgeBg: "bg-red-100 dark:bg-red-900",
      isNegative: true,
    },
    {
      title: "Lợi Nhuận Gộp",
      value: kpi.netCashFlow,
      growth: kpi.cashFlowGrowth,
      icon: "📈",
      color: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
      textColor: "text-blue-600 dark:text-blue-400",
      badgeBg: "bg-blue-100 dark:bg-blue-900",
    },
    {
      title: "Tồn Quỹ Hiện Tại",
      value: kpi.closingBalance,
      growth: undefined,
      icon: "🏦",
      color: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
      textColor: "text-amber-600 dark:text-amber-400",
      badgeBg: "bg-amber-100 dark:bg-amber-900",
      showWarning: kpi.closingBalance < 50000000,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`relative overflow-hidden rounded-lg border p-4 transition-shadow hover:shadow-lg ${card.color}`}
        >
          {card.showWarning && (
            <div className="absolute -right-2 -top-2 animate-pulse">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
          )}

          <div className="mb-3 text-3xl">{card.icon}</div>

          <p className="text-xs font-medium uppercase text-gray-600 dark:text-gray-400">
            {card.title}
          </p>

          <div className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(card.value)}
          </div>

          {card.growth !== undefined && (
            <div className="mt-3 flex items-center gap-1">
              {card.isNegative ? (
                <>
                  <TrendingDown className={`h-4 w-4 text-red-600 dark:text-red-400`} />
                  <span className={`text-xs font-semibold text-red-600 dark:text-red-400`}>
                    {formatPercentage(Math.abs(card.growth))}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    vs kỳ trước
                  </span>
                </>
              ) : (
                <>
                  {card.growth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={`text-xs font-semibold ${
                      card.growth >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {card.growth >= 0 ? "+" : ""}
                    {formatPercentage(card.growth)}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    vs kỳ trước
                  </span>
                </>
              )}
            </div>
          )}

          {card.title === "Tồn Quỹ Hiện Tại" && (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Đã chốt sổ hôm qua
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
