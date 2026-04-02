"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProductionReport } from "@/hooks/api";
import { useProducts } from "@/hooks/api/useProducts";
import { useWarehouses } from "@/hooks/api/useWarehouses";
import { useUsers } from "@/hooks/api/useUsers";
import ProductionReportFilters from "@/components/reports/ProductionReportFilters";
import ProductionKPICards from "@/components/reports/ProductionKPICards";
import ProductionCharts from "@/components/reports/ProductionCharts";
import ProductionDataTables from "@/components/reports/ProductionDataTables";
import { Factory } from "lucide-react";
import type { ProductionReportFilters as ProdFilters } from "@/types/report.types";
import { Product, User, Warehouse } from "@/types";

export default function ProductionReportPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ProdFilters>({});
  const [hasAppliedFilter, setHasAppliedFilter] = useState(false);

  // API calls
  const { data: report, isLoading, error } = useProductionReport(
    hasAppliedFilter
      ? {
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          status: filters.status,
          finishedProductId: filters.finishedProductId,
          createdBy: filters.createdBy,
        }
      : undefined
  );
  const { data: productsData } = useProducts();
  const products = productsData?.data as unknown as Product[] || [];
  const { data: warehousesData } = useWarehouses();
  const warehouses = warehousesData?.data as unknown as Warehouse[] || [];
  const { data: usersData } = useUsers({ limit: 100 });
  const users = usersData?.data as unknown as User[] || [];

  const handleFilterChange = (newFilters: ProdFilters) => {
    queryClient.invalidateQueries({ queryKey: ["reports", "production"] });
    setFilters(newFilters);
    setHasAppliedFilter(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Báo cáo Sản xuất
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Phân tích tiến độ, hiệu suất sản xuất và chi phí thành phẩm
          </p>
        </div>
      </div>

      {/* Filters */}
      <ProductionReportFilters
        onFilterChange={handleFilterChange}
        initialFilters={filters}
        products={products || []}
        warehouses={warehouses || []}
        staff={users || []}
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
          {/* 1. KPI Summary Cards - 3 câu hỏi chính */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              3 Chỉ số Chính
            </h2>
            <ProductionKPICards data={report} isLoading={false} />
          </div>

          {/* 2. Charts - Biểu đồ phân tích */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Biểu đồ Phân tích
            </h2>
            <ProductionCharts data={report} isLoading={false} />
          </div>

          {/* 3. Data Tables - Chi tiết theo tabs */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Dữ liệu Chi tiết
            </h2>
            <ProductionDataTables data={report} isLoading={false} />
          </div>
        </>
      )}

      {/* No Data State */}
      {!isLoading && !hasAppliedFilter && (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="text-center">
            <Factory className="mx-auto h-12 w-12 text-gray-400" />
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
            <Factory className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Không có dữ liệu phù hợp với bộ lọc
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
