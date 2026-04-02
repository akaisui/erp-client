"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSalesReport } from "@/hooks/api/useReports";
import { useWarehouses } from "@/hooks/api/useWarehouses";
import SalesReportFilters from "@/components/reports/SalesReportFilters";
import SalesKPICards from "@/components/reports/SalesKPICards";
import SalesCharts from "@/components/reports/SalesCharts";
import SalesDataTables from "@/components/reports/SalesDataTables";
import { BarChart3 } from "lucide-react";
import type { SalesReportFilters as SalesFilters } from "@/types/report.types";
import { Warehouse } from "@/types";

export default function SalesReportPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<SalesFilters>({});
  const [hasAppliedFilter, setHasAppliedFilter] = useState(false);

  // API calls
  const { data: report, isLoading, error } = useSalesReport(hasAppliedFilter ? filters : undefined);
  const { data: warehousesWrapper } = useWarehouses();
  const warehousesData = warehousesWrapper?.data as unknown as Warehouse[];

  const handleFilterChange = (newFilters: SalesFilters) => {
    queryClient.invalidateQueries({ queryKey: ["reports", "sales"] });
    setFilters(newFilters);
    setHasAppliedFilter(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Báo cáo Doanh thu & Hiệu quả Bán hàng
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Phân tích doanh số, doanh thu thuần, thực thu, công nợ phát sinh theo thời gian và nhân viên
          </p>
        </div>
      </div>

      {/* Filters */}
      <SalesReportFilters
        onFilterChange={handleFilterChange}
        warehouses={warehousesData?.map((w: any) => ({ id: w.id, warehouseName: w.warehouseName })) || []}
        isLoading={isLoading}
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
              Tổng quan KPI
            </h2>
            <SalesKPICards summary={report.summary} isLoading={false} />
          </div>

          {/* 2. Charts */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Biểu đồ Trực quan
            </h2>
            <SalesCharts data={report} isLoading={false} />
          </div>

          {/* 3. Data Tables with Tabs */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Phân tích Chi tiết
            </h2>
            <SalesDataTables data={report} isLoading={false} />
          </div>
        </>
      )}

      {/* No Data State */}
      {!isLoading && !hasAppliedFilter && (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Vui lòng chọn bộ lọc và nhấn "Áp dụng" để xem báo cáo
            </p>
          </div>
        </div>
      )}

      {/* Empty Result State */}
      {!isLoading && report && hasAppliedFilter && !report.topProducts?.length && (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Không có dữ liệu phù hợp với bộ lọc
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
