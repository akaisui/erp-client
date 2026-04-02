"use client";

import React, { useState } from "react";
import { Calendar, Download, Printer, Lock } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { format, startOfMonth, subDays, startOfQuarter } from "date-fns";
import type { FinancialReportFilters as FinFilters } from "@/types/report.types";

interface FinancialReportFiltersProps {
  onFilterChange: (filters: FinFilters) => void;
  initialFilters?: FinFilters;
}

const PRESET_OPTIONS = [
  { value: "today", label: "Hôm nay" },
  { value: "yesterday", label: "Hôm qua" },
  { value: "thisWeek", label: "Tuần này" },
  { value: "thisMonth", label: "Tháng này" },
  { value: "lastMonth", label: "Tháng trước" },
  { value: "thisYear", label: "Năm nay" },
  { value: "custom", label: "Tùy chỉnh" },
];

export default function FinancialReportFilters({
  onFilterChange,
  initialFilters = {},
}: FinancialReportFiltersProps) {
  const today = new Date();
  const defaultFromDate = format(startOfMonth(today), "yyyy-MM-dd");
  const defaultToDate = format(today, "yyyy-MM-dd");

  const [selectedPreset, setSelectedPreset] = useState<string>(
    initialFilters.datePreset || "thisMonth"
  );
  const [fromDate, setFromDate] = useState(initialFilters.fromDate || defaultFromDate);
  const [toDate, setToDate] = useState(initialFilters.toDate || defaultToDate);
  const [isCustom, setIsCustom] = useState(selectedPreset === "custom");

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    setIsCustom(preset === "custom");

    if (preset !== "custom") {
      let newFromDate = defaultFromDate;
      let newToDate = format(today, "yyyy-MM-dd");

      switch (preset) {
        case "today":
          newFromDate = format(today, "yyyy-MM-dd");
          break;
        case "yesterday":
          newFromDate = format(subDays(today, 1), "yyyy-MM-dd");
          newToDate = format(subDays(today, 1), "yyyy-MM-dd");
          break;
        case "thisWeek":
          newFromDate = format(subDays(today, today.getDay()), "yyyy-MM-dd");
          break;
        case "thisMonth":
          newFromDate = defaultFromDate;
          break;
        case "lastMonth":
          const lastMonthDate = subDays(today, today.getDate());
          newFromDate = format(startOfMonth(lastMonthDate), "yyyy-MM-dd");
          newToDate = format(lastMonthDate, "yyyy-MM-dd");
          break;
        case "thisYear":
          newFromDate = format(new Date(today.getFullYear(), 0, 1), "yyyy-MM-dd");
          break;
      }

      setFromDate(newFromDate);
      setToDate(newToDate);
    }
  };

  const handleApply = () => {
    const filters: FinFilters = {
      datePreset: selectedPreset as any,
    };

    if (isCustom && fromDate && toDate) {
      filters.fromDate = fromDate;
      filters.toDate = toDate;
    } else if (!isCustom) {
      filters.fromDate = fromDate;
      filters.toDate = toDate;
    }

    onFilterChange(filters);
  };

  const handleExportExcel = () => {
    console.log("Exporting to Excel...");
    // TODO: Implement Excel export
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleLockCashBook = () => {
    console.log("Locking cash fund...");
    // TODO: Implement lock cash fund functionality
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      {/* Title */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Bộ lọc Thời gian
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Chọn khoảng thời gian để xem báo cáo tài chính chi tiết
        </p>
      </div>

      {/* Preset Options */}
      <div className="flex flex-wrap gap-2">
        {PRESET_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handlePresetChange(option.value)}
            className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
              selectedPreset === option.value
                ? "bg-blue-600 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range */}
      {isCustom && (
        <div className="mt-4 flex flex-col gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700 sm:flex-row">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        <Button
          onClick={handleApply}
          className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          <Calendar className="h-4 w-4" />
          Áp dụng
        </Button>

        <Button
          onClick={handleExportExcel}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Xuất Excel
        </Button>

        <Button
          onClick={handlePrintReport}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Printer className="h-4 w-4" />
          In Báo cáo
        </Button>

        <Button
          onClick={handleLockCashBook}
          variant="outline"
          className="flex items-center gap-2 border-amber-300 text-amber-600 hover:bg-amber-50"
        >
          <Lock className="h-4 w-4" />
          Chốt sổ quỹ
        </Button>
      </div>
    </div>
  );
}
