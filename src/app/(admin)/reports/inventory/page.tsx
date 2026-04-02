"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import InventoryFilterBar from "@/components/reports/InventoryFilterBar";
import InventoryKPICards from "@/components/reports/InventoryKPICards";
import InventoryCharts from "@/components/reports/InventoryCharts";
import InventoryDataTable from "@/components/reports/InventoryDataTable";
import BatchExpiryReport from "@/components/reports/BatchExpiryReport";
import { exportInventoryToExcel, exportInventoryToPDF } from "@/lib/inventory-exporter";
import { AlertCircle, FileText } from "lucide-react";

interface ReportFilters {
  warehouseId?: number | string;
  categoryId?: number | string;
  productType?: string;
  searchTerm?: string;
  fromDate?: string;
  toDate?: string;
  showLowStock?: boolean;
  showExpiring?: boolean;
}

export default function InventoryReportPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "stock-flow" | "batch-expiry">(
    "overview"
  );
  const [filters, setFilters] = useState<ReportFilters>({});
  const [hasAppliedFilter, setHasAppliedFilter] = useState(false);

  // Fetch filter options
  const { data: filterData } = useQuery({
    queryKey: ["inventory-filter-data"],
    queryFn: async () => {
      const [warehousesRes, categoriesRes] = await Promise.all([
        api.get("/warehouses?limit=100"),
        api.get("/categories?limit=100"),
      ]);
      return {
        warehouses: warehousesRes.data?.data || [],
        categories: categoriesRes.data?.data || [],
      };
    },
  });

  // Fetch inventory report (Overview tab)
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ["inventory-report-overview", filters],
    queryFn: async () => {
      if (activeTab !== "overview") return null;
      const params = new URLSearchParams();
      if (filters.warehouseId) params.append("warehouseId", filters.warehouseId.toString());
      if (filters.categoryId) params.append("categoryId", filters.categoryId.toString());
      if (filters.productType) params.append("productType", filters.productType);
      if (filters.searchTerm) params.append("searchTerm", filters.searchTerm);
      if (filters.showLowStock) params.append("lowStock", "true");
      if (filters.showExpiring) params.append("showExpiring", "true");

      const queryString = params.toString();
      console.log("🔍 Fetching inventory with params:", queryString);
      const response = await api.get(`/reports/inventory${queryString ? '?' + queryString : ''}`);
      return response.data;
    },
    enabled: activeTab === "overview" && hasAppliedFilter,

  });

  // Fetch stock flow report (Stock Flow tab)
  const { data: stockFlowData, isLoading: isLoadingStockFlow } = useQuery({
    queryKey: ["inventory-report-stock-flow", filters],
    queryFn: async () => {
      if (activeTab !== "stock-flow") return null;
      const params = new URLSearchParams();
      if (filters.fromDate) params.append("fromDate", filters.fromDate);
      if (filters.toDate) params.append("toDate", filters.toDate);
      if (filters.warehouseId) params.append("warehouseId", filters.warehouseId.toString());
      if (filters.categoryId) params.append("categoryId", filters.categoryId.toString());
      if (filters.productType) params.append("productType", filters.productType);

      const response = await api.get(`/reports/inventory/stock-flow?${params.toString()}`);
      return response.data;
    },
    enabled: activeTab === "stock-flow" && hasAppliedFilter,
  });

  // Fetch batch expiry report (Batch Expiry tab)
  const { data: batchExpiryData, isLoading: isLoadingBatchExpiry } = useQuery({
    queryKey: ["inventory-report-batch-expiry", filters],
    queryFn: async () => {
      if (activeTab !== "batch-expiry") return null;
      const params = new URLSearchParams();
      if (filters.warehouseId) params.append("warehouseId", filters.warehouseId.toString());
      if (filters.categoryId) params.append("categoryId", filters.categoryId.toString());
      if (filters.productType) params.append("productType", filters.productType);

      const response = await api.get(`/reports/inventory/batch-expiry?${params.toString()}`);
      return response.data;
    },
    enabled: activeTab === "batch-expiry" && hasAppliedFilter,
  });

  const handleFilterChange = (newFilters: ReportFilters) => {
    setFilters(newFilters);
    setHasAppliedFilter(true);
  };

  const handleExport = (format: "excel" | "pdf") => {
    if (!inventoryData?.data || inventoryData.data.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const items = inventoryData.data.map((item: any) => ({
      productId: item.productId,
      sku: item.sku,
      productName: item.productName,
      unit: item.unit,
      quantity: item.quantity,
      reservedQuantity: item.reservedQuantity,
      availableQuantity: item.availableQuantity,
      minStockLevel: item.minStockLevel,
      unitPrice: item.unitPrice,
      totalValue: item.totalValue,
      status: 
        item.availableQuantity === 0
          ? "critical"
          : item.availableQuantity < item.minStockLevel
            ? "low"
            : "safe",
    }));

    if (format === "excel") {
      exportInventoryToExcel(items, inventoryData.summary);
    } else {
      exportInventoryToPDF(items, inventoryData.summary);
    }
  };

  const isLoading =
    isLoadingInventory || isLoadingStockFlow || isLoadingBatchExpiry;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Báo Cáo Tồn Kho & Giá Trị Kho
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Theo dõi tình hình tồn kho, giá trị kho, nhập-xuất theo kỳ, và hạn sử dụng lô hàng
        </p>
      </div>

      {/* Filter Bar */}
      <InventoryFilterBar
        onFilterChange={handleFilterChange}
        warehouses={filterData?.warehouses}
        categories={filterData?.categories}
        isLoading={isLoading}
        onExport={inventoryData?.data && inventoryData.data.length > 0 ? handleExport : undefined}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4 sm:gap-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 border-b-2 px-1 py-3 font-medium text-sm transition-colors ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <FileText className="h-4 w-4" />
            Tổng Quan
          </button>
          <button
            onClick={() => setActiveTab("stock-flow")}
            className={`flex items-center gap-2 border-b-2 px-1 py-3 font-medium text-sm transition-colors ${
              activeTab === "stock-flow"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <FileText className="h-4 w-4" />
            Nhập-Xuất-Tồn
          </button>
          <button
            onClick={() => setActiveTab("batch-expiry")}
            className={`flex items-center gap-2 border-b-2 px-1 py-3 font-medium text-sm transition-colors ${
              activeTab === "batch-expiry"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            <FileText className="h-4 w-4" />
            Hạn Sử Dụng
          </button>
        </div>
      </div>

      {/* Content by Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {!inventoryData?.data && !isLoading && Object.keys(filters).length === 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-300">
                    💡 Hướng dẫn sử dụng
                  </p>
                  <p className="mt-1 text-sm text-blue-800 dark:text-blue-400">
                    Vui lòng chọn bộ lọc và nhấn "Áp dụng" để xem báo cáo
                  </p>
                </div>
              </div>
            </div>
          )}

          {inventoryData && (
            <>
              {/* KPI Cards */}
              <InventoryKPICards
                totalValue={inventoryData.summary?.totalValue || 0}
                totalSKUs={inventoryData.summary?.totalItems || 0}
                lowStockCount={inventoryData.summary?.lowStockItems || 0}
                outOfStockCount={inventoryData.data?.filter((item: any) => item.availableQuantity === 0).length || 0}
                reservedQuantity={inventoryData.data?.reduce((sum: number, item: any) => sum + item.reservedQuantity, 0) || 0}
                capacityUsage={0}
                isLoading={isLoading}
              />

              {/* Charts */}
              <InventoryCharts
                byType={inventoryData.byType || []}
                topProducts={inventoryData.topProducts || []}
                flowByDay={inventoryData.flowByDay}
                isLoading={isLoading}
              />

              {/* Main Data Table */}
              <InventoryDataTable
                data={inventoryData.data?.map((item: any) => ({
                  productId: item.productId,
                  sku: item.sku,
                  productName: item.productName,
                  unit: item.unit,
                  imageUrl: item.imageUrl,
                  beginningQuantity: 0,
                  importQuantity: 0,
                  exportQuantity: 0,
                  endingQuantity: item.quantity,
                  availableQuantity: item.availableQuantity,
                  reservedQuantity: item.reservedQuantity,
                  minStockLevel: item.minStockLevel,
                  unitPrice: item.unitPrice,
                  totalValue: item.totalValue,
                  status:
                    item.availableQuantity === 0
                      ? "critical"
                      : item.availableQuantity < item.minStockLevel
                        ? "low"
                        : "safe",
                  categoryName: item.categoryName || "",
                  warehouseName: item.warehouseName || "",
                })) || []}
                isLoading={isLoading}
                onExport={handleExport}
                showStockFlow={false}
              />
            </>
          )}
        </div>
      )}

      {activeTab === "stock-flow" && (
        <div className="space-y-6">
          {!stockFlowData && !isLoading && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-300">
                    📅 Chọn khoảng thời gian
                  </p>
                  <p className="mt-1 text-sm text-blue-800 dark:text-blue-400">
                    Vui lòng chọn từ ngày - đến ngày và nhấn "Áp dụng" để xem báo cáo nhập-xuất-tồn
                  </p>
                </div>
              </div>
            </div>
          )}

          {stockFlowData && (
            <InventoryDataTable
              data={stockFlowData?.map((item: any) => ({
                productId: item.productId,
                sku: item.sku,
                productName: item.productName,
                unit: item.unit || "",
                beginningQuantity: item.beginningQuantity,
                importQuantity: item.importQuantity,
                exportQuantity: item.exportQuantity,
                endingQuantity: item.endingQuantity,
                availableQuantity: item.endingQuantity,
                reservedQuantity: 0,
                minStockLevel: 0,
                unitPrice: 0,
                totalValue: 0,
                status: "safe",
                categoryName: item.categoryName,
              })) || []}
              isLoading={isLoading}
              onExport={handleExport}
              showStockFlow={true}
            />
          )}
        </div>
      )}

      {activeTab === "batch-expiry" && (
        <div className="space-y-6">
          {!batchExpiryData && !isLoading && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-300">
                    🔍 Chọn bộ lọc
                  </p>
                  <p className="mt-1 text-sm text-blue-800 dark:text-blue-400">
                    Vui lòng chọn bộ lọc và nhấn "Áp dụng" để xem báo cáo hạn sử dụng
                  </p>
                </div>
              </div>
            </div>
          )}
          {batchExpiryData && (
            <BatchExpiryReport
              data={batchExpiryData.map((item: any) => ({
                productId: 0,
                productName: item.productName,
                sku: item.sku,
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate,
                warehouse: item.warehouse,
                daysRemaining: item.daysRemaining,
                quantity: item.quantity,
                status: item.status,
              })) || []}
              isLoading={isLoading}
              onExport={handleExport}
            />
          )}
        </div>
      )}
    </div>
  );
}
