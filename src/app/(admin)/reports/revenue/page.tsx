"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRevenueReport } from "@/hooks/api/useReports";
import RevenueReportFilters from "@/components/reports/RevenueReportFilters";
import KPICards from "@/components/reports/KPICards";
import RevenueCharts from "@/components/reports/RevenueCharts";
import RevenueDataTables from "@/components/reports/RevenueDataTables";
import Button from "@/components/ui/button/Button";
import { RevenueReportExporterV2 } from "@/lib/revenue-report-exporter-v2";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "react-hot-toast";
import type { RevenueReportFilters as RevenueFilters } from "@/types/report.types";
import { BarChart3 } from "lucide-react";

export default function RevenueReportPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<RevenueFilters>({});
  const [hasAppliedFilter, setHasAppliedFilter] = useState(false);

  const { data: report, isLoading, error } = useRevenueReport(hasAppliedFilter ? filters : undefined);

  const handleFilterChange = (newFilters: RevenueFilters) => {
    queryClient.invalidateQueries({ queryKey: ["reports", "revenue"] });
    setFilters(newFilters);
    setHasAppliedFilter(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Báo cáo Doanh Thu Bán Hàng
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Theo dõi doanh thu theo thời gian, kênh bán hàng, chi nhánh và nhân viên
          </p>
        </div>

        {/* Export Buttons - Only show when data exists */}
        {report && report.orders && report.orders.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="ssmm"
              onClick={() => {
                try {
                  RevenueReportExporterV2.exportToExcel(report, {
                    title: "Báo Cáo Doanh Thu Bán Hàng",
                    fromDate: filters.fromDate,
                    toDate: filters.toDate,
                  });
                  toast.success("✅ Xuất Excel thành công!");
                } catch (error) {
                  toast.error("❌ Xuất Excel thất bại!");
                  console.error(error);
                }
              }}
              disabled={false}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Xuất Excel (2 Sheet)
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <RevenueReportFilters
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
              Chỉ số Tổng quan
            </h2>
            <KPICards data={report} isLoading={false} />
          </div>

          {/* 2. Charts */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Biểu đồ Trực quan
            </h2>
            <RevenueCharts data={report} isLoading={false} />
          </div>

          {/* 3. Data Tables */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Dữ liệu Chi tiết
            </h2>
            <RevenueDataTables data={report} isLoading={false} />
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
      {!isLoading && report && hasAppliedFilter && !report.orders?.length && (
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
