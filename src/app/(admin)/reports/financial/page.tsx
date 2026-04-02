"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFinancialReport } from "@/hooks/api/useReports";
import FinancialReportFilters from "@/components/reports/FinancialReportFilters";
import FinancialKPICards from "@/components/reports/FinancialKPICards";
import FinancialCharts from "@/components/reports/FinancialCharts";
import FinancialCashLedger from "@/components/reports/FinancialCashLedger";
import { DollarSign } from "lucide-react";
import type { FinancialReportFilters as FinFilters } from "@/types/report.types";

export default function FinancialReportPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FinFilters>({});
  const [hasAppliedFilter, setHasAppliedFilter] = useState(false);

  // API call
  const { data: report, isLoading, error } = useFinancialReport(hasAppliedFilter ? filters : undefined);

  const handleFilterChange = (newFilters: FinFilters) => {
    queryClient.invalidateQueries({ queryKey: ["reports", "financial"] });
    setFilters(newFilters);
    setHasAppliedFilter(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Báo cáo Tài chính
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Theo dõi dòng tiền, chi phí và đối soát sổ quỹ hàng ngày
          </p>
        </div>
      </div>

      {/* Filters */}
      <FinancialReportFilters
        onFilterChange={handleFilterChange}
        initialFilters={filters}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-400">Đang tải dữ liệu báo cáo...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">
            Lỗi tải dữ liệu: {error instanceof Error ? error.message : "Vui lòng thử lại"}
          </p>
        </div>
      )}

      {/* Report Content */}
      {!isLoading && report && hasAppliedFilter && (
        <>
          {/* 1. KPI Summary Cards */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Tình Hình Tài Chính
            </h2>
            <FinancialKPICards data={report} isLoading={false} />
          </div>

          {/* 2. Charts */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Biểu đồ Phân tích
            </h2>
            <FinancialCharts data={report} isLoading={false} />
          </div>

          {/* 3. Cash Ledger */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Dữ liệu Chi tiết
            </h2>
            <FinancialCashLedger data={report} isLoading={false} />
          </div>
        </>
      )}

      {/* No Data State */}
      {!isLoading && !hasAppliedFilter && (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="text-center">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Vui lòng chọn bộ lọc và nhấn "Áp dụng" để xem báo cáo
            </p>
          </div>
        </div>
      )}

      {/* Empty Result State */}
      {!isLoading && report && hasAppliedFilter && !report.cashLedger?.length && (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="text-center">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Không có dữ liệu phù hợp với bộ lọc
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
