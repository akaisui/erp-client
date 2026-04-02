"use client";

import React, { useState } from "react";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Search, RotateCcw } from "lucide-react";
import type { RevenueReportFilters } from "@/types/report.types";

interface InventoryFiltersProps {
  onFilterChange: (filters: InventoryReportFilters) => void;
  initialFilters?: InventoryReportFilters;
  warehouses?: Array<{ id: number; warehouseName: string }>;
  categories?: Array<{ id: number; categoryName: string }>;
}

const PRODUCT_TYPE_OPTIONS = [
  { label: "Tất cả loại", value: "" },
  { label: "Nguyên liệu", value: "raw_material" },
  { label: "Bao bì", value: "packaging" },
  { label: "Thành phẩm", value: "finished_product" },
  { label: "Hàng hóa", value: "goods" },
];

const STOCK_STATUS_OPTIONS = [
  { label: "Tất cả", value: "" },
  { label: "An toàn", value: "safe" },
  { label: "Thấp", value: "low_stock" },
  { label: "Hết hàng", value: "out_of_stock" },
];

export default function InventoryReportFilters({
  onFilterChange,
  initialFilters = {},
  warehouses = [],
  categories = [],
}: InventoryFiltersProps) {
  const [filters, setFilters] = useState<InventoryReportFilters>({
    warehouseId: initialFilters.warehouseId,
    categoryId: initialFilters.categoryId,
    productType: initialFilters.productType,
    stockStatus: initialFilters.stockStatus,
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleApply = () => {
    onFilterChange(filters);
  };

  const handleReset = () => {
    const resetFilters: InventoryReportFilters = {};
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Warehouse */}
        {warehouses.length > 0 && (
          <div>
            <Select
              label="Chi nhánh/Kho"
              value={filters.warehouseId?.toString() || ""}
              onChange={(e) =>
                handleFilterChange("warehouseId", e.target.value ? parseInt(e.target.value) : undefined)
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

        {/* Category */}
        {categories.length > 0 && (
          <div>
            <Select
              label="Danh mục"
              value={filters.categoryId?.toString() || ""}
              onChange={(e) =>
                handleFilterChange("categoryId", e.target.value ? parseInt(e.target.value) : undefined)
              }
              options={[
                { label: "Tất cả danh mục", value: "" },
                ...categories.map((c) => ({
                  label: c.categoryName,
                  value: c.id.toString(),
                })),
              ]}
            />
          </div>
        )}

        {/* Product Type */}
        <div>
          <Select
            label="Loại sản phẩm"
            value={filters.productType || ""}
            onChange={(e) => handleFilterChange("productType", e.target.value || undefined)}
            options={PRODUCT_TYPE_OPTIONS}
          />
        </div>

        {/* Stock Status */}
        <div>
          <Select
            label="Trạng thái tồn"
            value={filters.stockStatus || ""}
            onChange={(e) => handleFilterChange("stockStatus", e.target.value || undefined)}
            options={STOCK_STATUS_OPTIONS}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button variant="primary" onClick={handleApply}>
          <Search className="mr-2 h-4 w-4" />
          Áp dụng
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Đặt lại
        </Button>
      </div>
    </div>
  );
}
