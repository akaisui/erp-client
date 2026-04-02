"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import { Search, RotateCcw, Download } from "lucide-react";
import Select from "@/components/form/Select";

interface InventoryFilterBarProps {
  onFilterChange: (filters: any) => void;
  warehouses?: Array<{ id: number; warehouseName: string }>;
  categories?: Array<{ id: number; categoryName: string; parentId?: number }>;
  isLoading?: boolean;
  onExport?: (format: "excel" | "pdf") => void;
}

export default function InventoryFilterBar({
  onFilterChange,
  warehouses = [],
  categories = [],
  isLoading = false,
  onExport,
}: InventoryFilterBarProps) {
  const [filters, setFilters] = useState({
    warehouseId: "",
    categoryId: "",
    productType: "",
    searchTerm: "",
    fromDate: "",
    toDate: "",
    showLowStock: false,
    showExpiring: false,
  });

  const productTypeOptions = [
    { label: "Tất cả loại", value: "" },
    { label: "Nguyên liệu", value: "raw_material" },
    { label: "Bao bì", value: "packaging" },
    { label: "Thành phẩm", value: "finished_product" },
    { label: "Hàng hóa", value: "goods" },
  ];

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleApply = () => {
    onFilterChange(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      warehouseId: "",
      categoryId: "",
      productType: "",
      searchTerm: "",
      fromDate: "",
      toDate: "",
      showLowStock: false,
      showExpiring: false,
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Row 1: Main Filters */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Warehouse Select */}
        {warehouses.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chi nhánh/Kho
            </label>
            <Select
              value={filters.warehouseId?.toString() || ""}
              onChange={(e) =>
                handleFilterChange("warehouseId", e.target.value ? parseInt(e.target.value) : "")
              }
              options={[
                { label: "Tất cả kho", value: "" },
                ...warehouses.map((w) => ({
                  label: w.warehouseName,
                  value: w.id.toString(),
                })),
              ]}
            />
          </div>
        )}

        {/* Category Select */}
        {categories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Danh mục
            </label>
            <Select
              value={filters.categoryId?.toString() || ""}
              onChange={(e) =>
                handleFilterChange("categoryId", e.target.value ? parseInt(e.target.value) : "")
              }
              options={[
                { label: "Tất cả danh mục", value: "" },
                ...categories.map((c) => ({
                  label: `${c.parentId ? "  └─ " : ""}${c.categoryName}`,
                  value: c.id.toString(),
                })),
              ]}
            />
          </div>
        )}

        {/* Product Type Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Loại sản phẩm
          </label>
          <Select
            value={filters.productType}
            onChange={(value) => handleFilterChange("productType", value)}
            options={productTypeOptions}
          />
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tìm kiếm
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="SKU, tên sản phẩm..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 placeholder-gray-500 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Date Range & Checkboxes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {/* From Date */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Từ ngày (YYYY-MM-DD)
          </label>
          <input
            type="text"
            placeholder="2025-12-07"
            value={filters.fromDate || ""}
            onChange={(e) => handleFilterChange("fromDate", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* To Date */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Đến ngày (YYYY-MM-DD)
          </label>
          <input
            type="text"
            placeholder="2026-01-07"
            value={filters.toDate || ""}
            onChange={(e) => handleFilterChange("toDate", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Checkbox: Low Stock */}
        <div className="flex items-end md:col-span-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showLowStock}
              onChange={(e) => handleFilterChange("showLowStock", e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Tồn kho thấp
            </span>
          </label>
        </div>

        {/* Checkbox: Expiring */}
        <div className="flex items-end md:col-span-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showExpiring}
              onChange={(e) => handleFilterChange("showExpiring", e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Sắp hết hạn
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-end gap-2 md:col-span-2">
          <Button
            variant="primary"
            size="ssmm"
            onClick={handleApply}
            disabled={isLoading}
            className="flex-1"
          >
            Áp dụng
          </Button>
          <Button
            variant="outline"
            size="ssmm"
            onClick={handleReset}
            startIcon={<RotateCcw className="h-4 w-4" />}
          >
            Đặt lại
          </Button>
          {onExport && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="ssmm"
                onClick={() => onExport("excel")}
                startIcon={<Download className="h-4 w-4" />}
              >
                Excel
              </Button>
              <Button
                variant="outline"
                size="ssmm"
                onClick={() => onExport("pdf")}
                startIcon={<Download className="h-4 w-4" />}
              >
                PDF
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
