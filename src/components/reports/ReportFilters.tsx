"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "@/components/form/date-picker";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Search, RotateCcw } from "lucide-react";
import { format, subDays } from "date-fns";

export interface ReportFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
  initialFilters?: Record<string, any>;
  showDateRange?: boolean;
  showGroupBy?: boolean;
  showSalesChannel?: boolean;
  showWarehouse?: boolean;
  showCategory?: boolean;
  showProductType?: boolean;
  showLimit?: boolean;
  customFilters?: React.ReactNode;
  warehouses?: Array<{ id: number; warehouse_name: string }>;
  categories?: Array<{ id: number; category_name: string }>;
}

const GROUP_BY_OPTIONS = [
  { label: "Theo ngày", value: "day" },
  { label: "Theo tuần", value: "week" },
  { label: "Theo tháng", value: "month" },
  { label: "Theo năm", value: "year" },
];

const SALES_CHANNEL_OPTIONS = [
  { label: "Tất cả kênh", value: "" },
  { label: "Bán lẻ", value: "retail" },
  { label: "Bán sỉ", value: "wholesale" },
  { label: "Trực tuyến", value: "online" },
  { label: "Đại lý", value: "distributor" },
];

const PRODUCT_TYPE_OPTIONS = [
  { label: "Tất cả loại", value: "" },
  { label: "Nguyên liệu", value: "raw_material" },
  { label: "Bao bì", value: "packaging" },
  { label: "Thành phẩm", value: "finished_product" },
  { label: "Hàng hóa", value: "goods" },
];

const LIMIT_OPTIONS = [
  { label: "Top 10", value: "10" },
  { label: "Top 20", value: "20" },
  { label: "Top 50", value: "50" },
  { label: "Top 100", value: "100" },
];

export default function ReportFilters({
  onFilterChange,
  initialFilters = {},
  showDateRange = true,
  showGroupBy = false,
  showSalesChannel = false,
  showWarehouse = false,
  showCategory = false,
  showProductType = false,
  showLimit = false,
  customFilters,
  warehouses = [],
  categories = [],
}: ReportFiltersProps) {
  // Default date range: last 30 days
  const today = new Date();
  const defaultFromDate = format(subDays(today, 30), "yyyy-MM-dd");
  const defaultToDate = format(today, "yyyy-MM-dd");

  const [filters, setFilters] = useState({
    fromDate: initialFilters.fromDate || defaultFromDate,
    toDate: initialFilters.toDate || defaultToDate,
    groupBy: initialFilters.groupBy || "day",
    salesChannel: initialFilters.salesChannel || "",
    warehouseId: initialFilters.warehouseId || "",
    categoryId: initialFilters.categoryId || "",
    productType: initialFilters.productType || "",
    limit: initialFilters.limit || "10",
    ...initialFilters,
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = () => {
    // Remove empty values
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
    );
    onFilterChange(cleanedFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      fromDate: defaultFromDate,
      toDate: defaultToDate,
      groupBy: "day",
      salesChannel: "",
      warehouseId: "",
      categoryId: "",
      productType: "",
      limit: "10",
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  // Apply filters on mount if initialFilters provided
  useEffect(() => {
    if (Object.keys(initialFilters).length > 0) {
      onFilterChange(filters);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Date Range */}
        {showDateRange && (
          <>
            <div>
              <DatePicker
                id="fromDate"
                label="Từ ngày"
                placeholder="Chọn ngày bắt đầu"
                defaultDate={filters.fromDate}
                onChange={(selectedDates) => {
                  if (selectedDates.length > 0) {
                    handleFilterChange("fromDate", format(selectedDates[0], "yyyy-MM-dd"));
                  }
                }}
              />
            </div>

            <div>
              <DatePicker
                id="toDate"
                label="Đến ngày"
                placeholder="Chọn ngày kết thúc"
                defaultDate={filters.toDate}
                onChange={(selectedDates) => {
                  if (selectedDates.length > 0) {
                    handleFilterChange("toDate", format(selectedDates[0], "yyyy-MM-dd"));
                  }
                }}
              />
            </div>
          </>
        )}

        {/* Group By */}
        {showGroupBy && (
          <div>
            <Select
              label="Nhóm theo"
              value={filters.groupBy}
              onChange={(e) => handleFilterChange("groupBy", e.target.value)}
              options={GROUP_BY_OPTIONS}
            />
          </div>
        )}

        {/* Sales Channel */}
        {showSalesChannel && (
          <div>
            <Select
              label="Kênh bán hàng"
              value={filters.salesChannel}
              onChange={(e) => handleFilterChange("salesChannel", e.target.value)}
              options={SALES_CHANNEL_OPTIONS}
            />
          </div>
        )}

        {/* Warehouse */}
        {showWarehouse && warehouses.length > 0 && (
          <div>
            <Select
              label="Kho"
              value={filters.warehouseId}
              onChange={(e) => handleFilterChange("warehouseId", e.target.value)}
              options={[
                { label: "Tất cả kho", value: "" },
                ...warehouses.map((w) => ({
                  label: w.warehouse_name,
                  value: w.id.toString(),
                })),
              ]}
            />
          </div>
        )}

        {/* Category */}
        {showCategory && categories.length > 0 && (
          <div>
            <Select
              label="Danh mục"
              value={filters.categoryId}
              onChange={(e) => handleFilterChange("categoryId", e.target.value)}
              options={[
                { label: "Tất cả danh mục", value: "" },
                ...categories.map((c) => ({
                  label: c.category_name,
                  value: c.id.toString(),
                })),
              ]}
            />
          </div>
        )}

        {/* Product Type */}
        {showProductType && (
          <div>
            <Select
              label="Loại sản phẩm"
              value={filters.productType}
              onChange={(e) => handleFilterChange("productType", e.target.value)}
              options={PRODUCT_TYPE_OPTIONS}
            />
          </div>
        )}

        {/* Limit */}
        {showLimit && (
          <div>
            <Select
              label="Số lượng hiển thị"
              value={filters.limit}
              onChange={(e) => handleFilterChange("limit", e.target.value)}
              options={LIMIT_OPTIONS}
            />
          </div>
        )}

        {/* Custom Filters */}
        {customFilters}
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
