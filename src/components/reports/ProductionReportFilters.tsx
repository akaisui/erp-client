"use client";

import React, { useState } from "react";
import { SimpleDatePicker } from "@/components/form/SimpleDatePicker";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Search, RotateCcw, Download, FileText } from "lucide-react";
import { format, subDays, startOfMonth } from "date-fns";
import type { ProductionReportFilters as ProdFilters } from "@/types/report.types";

interface ProductionReportFiltersProps {
  onFilterChange: (filters: ProdFilters) => void;
  initialFilters?: ProdFilters;
  products?: Array<{ id: number; productName: string }>;
  warehouses?: Array<{ id: number; warehouseName: string }>;
  staff?: Array<{ id: number; fullName: string; employeeCode: string }>;
}

const DATE_PRESET_OPTIONS = [
  { label: "Hôm nay", value: "today" },
  { label: "Tuần này", value: "thisWeek" },
  { label: "Tháng này", value: "thisMonth" },
  { label: "Quý này", value: "thisQuarter" },
  { label: "Tùy chỉnh", value: "custom" },
];

const STATUS_OPTIONS = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Đang chạy", value: "in_progress" },
  { label: "Đã hoàn thành", value: "completed" },
  { label: "Chờ xử lý", value: "pending" },
  { label: "Hủy/Tạm dừng", value: "cancelled" },
];

export default function ProductionReportFilters({
  onFilterChange,
  initialFilters = {},
  products = [],
  warehouses = [],
  staff = [],
}: ProductionReportFiltersProps) {
  const today = new Date();
  const defaultFromDate = format(startOfMonth(today), "yyyy-MM-dd");
  const defaultToDate = format(today, "yyyy-MM-dd");

  const [filters, setFilters] = useState<ProdFilters & { datePreset?: string }>({
    fromDate: initialFilters.fromDate || defaultFromDate,
    toDate: initialFilters.toDate || defaultToDate,
    datePreset: "thisMonth",
    status: initialFilters.status || "all",
    ...initialFilters,
  });

  const handlePresetChange = (preset: string) => {
    let newFromDate = defaultFromDate;
    let newToDate = format(today, "yyyy-MM-dd");

    switch (preset) {
      case "today":
        newFromDate = format(today, "yyyy-MM-dd");
        break;
      case "thisWeek":
        newFromDate = format(subDays(today, today.getDay()), "yyyy-MM-dd");
        break;
      case "thisMonth":
        newFromDate = defaultFromDate;
        break;
      case "thisQuarter":
        const quarter = Math.floor(today.getMonth() / 3);
        newFromDate = format(new Date(today.getFullYear(), quarter * 3, 1), "yyyy-MM-dd");
        break;
      case "custom":
        break;
    }

    setFilters((prev) => ({
      ...prev,
      datePreset: preset,
      fromDate: newFromDate,
      toDate: newToDate,
    }));
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = () => {
    const { datePreset, ...cleanedFilters } = filters;
    const cleanFilters = Object.fromEntries(
      Object.entries(cleanedFilters).filter(([_, v]) => v !== "" && v !== null && v !== undefined && v !== "all")
    );
    onFilterChange(cleanFilters as ProdFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      fromDate: defaultFromDate,
      toDate: defaultToDate,
      datePreset: "thisMonth",
      status: "all",
    };
    setFilters(resetFilters);
    onFilterChange({ fromDate: defaultFromDate, toDate: defaultToDate });
  };

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (filters.fromDate) params.append("fromDate", filters.fromDate);
    if (filters.toDate) params.append("toDate", filters.toDate);
    if (filters.status && filters.status !== "all") params.append("status", filters.status);
    if (filters.productId) params.append("finishedProductId", filters.productId.toString());
    if (filters.createdBy) params.append("createdBy", filters.createdBy.toString());
    window.open(`/api/reports/production/export/excel?${params.toString()}`, "_blank");
  };

  const handleExportPDF = () => {
    const params = new URLSearchParams();
    if (filters.fromDate) params.append("fromDate", filters.fromDate);
    if (filters.toDate) params.append("toDate", filters.toDate);
    if (filters.status && filters.status !== "all") params.append("status", filters.status);
    if (filters.productId) params.append("finishedProductId", filters.productId.toString());
    if (filters.createdBy) params.append("createdBy", filters.createdBy.toString());
    window.open(`/api/reports/production/export/pdf?${params.toString()}`, "_blank");
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sticky top-0 z-10">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Date Preset */}
        <div>
          <Select
            label="Thời gian"
            value={filters.datePreset || "thisMonth"}
            onChange={(e) => handlePresetChange(e.target.value)}
            options={DATE_PRESET_OPTIONS}
          />
        </div>

        {/* From Date */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Từ ngày</label>
          <SimpleDatePicker
            value={filters.fromDate}
            onChange={(value) => {
              handleFilterChange("fromDate", value);
              handleFilterChange("datePreset", "custom");
            }}
            placeholder="Chọn ngày bắt đầu"
          />
        </div>

        {/* To Date */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đến ngày</label>
          <SimpleDatePicker
            value={filters.toDate}
            onChange={(value) => {
              handleFilterChange("toDate", value);
              handleFilterChange("datePreset", "custom");
            }}
            placeholder="Chọn ngày kết thúc"
          />
        </div>

        {/* Status */}
        <div>
          <Select
            label="Trạng thái lệnh"
            value={filters.status || "all"}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>

        {/* Product (if available) */}
        {products.length > 0 && (
          <div>
            <Select
              label="Thành phẩm"
              value={(filters.productId as any) || ""}
              onChange={(e) => handleFilterChange("productId", e.target.value ? parseInt(e.target.value) : undefined)}
              options={[
                { label: "Tất cả sản phẩm", value: "" },
                ...products.map((p) => ({
                  label: p.productName,
                  value: p.id.toString(),
                })),
              ]}
            />
          </div>
        )}

        {/* Warehouse (if available) */}
        {warehouses.length > 0 && (
          <div>
            <Select
              label="Xưởng/Kho"
              value={(filters.warehouseId as any) || ""}
              onChange={(e) => handleFilterChange("warehouseId", e.target.value ? parseInt(e.target.value) : undefined)}
              options={[
                { label: "Tất cả xưởng", value: "" },
                ...warehouses.map((w) => ({
                  label: w.warehouseName,
                  value: w.id.toString(),
                })),
              ]}
            />
          </div>
        )}

        {/* Staff (Người phụ trách) */}
        {staff.length > 0 && (
          <div>
            <Select
              label="Người phụ trách"
              value={(filters.createdBy as any) || ""}
              onChange={(e) => handleFilterChange("createdBy", e.target.value ? parseInt(e.target.value) : undefined)}
              options={[
                { label: "Tất cả nhân viên", value: "" },
                ...staff.map((s) => ({
                  label: `${s.fullName} (${s.employeeCode})`,
                  value: s.id.toString(),
                })),
              ]}
            />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={handleApply}>
          <Search className="mr-2 h-4 w-4" />
          Áp dụng
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Đặt lại
        </Button>
        <div className="flex-1" />
        <Button variant="outline" onClick={handleExportExcel} size="sm">
          <Download className="mr-2 h-4 w-4" />
          Xuất Excel
        </Button>
        <Button variant="outline" onClick={handleExportPDF} size="sm">
          <FileText className="mr-2 h-4 w-4" />
          Xuất PDF
        </Button>
      </div>
    </div>
  );
}
