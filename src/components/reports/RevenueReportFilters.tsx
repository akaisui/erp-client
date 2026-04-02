"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import { SimpleDatePicker } from "@/components/form/SimpleDatePicker";
import { Search, RotateCcw } from "lucide-react";
import { useReportDatePresets } from "@/hooks/useReportDatePresets";
import type { RevenueReportFilters } from "@/types/report.types";

interface RevenueReportFiltersProps {
  onFilterChange: (filters: RevenueReportFilters) => void;
  initialFilters?: RevenueReportFilters;
}

export default function RevenueReportFilters({
  onFilterChange,
  initialFilters = {},
}: RevenueReportFiltersProps) {
  const datePresets = useReportDatePresets();
  
  const defaultPreset = datePresets[datePresets.length - 1];

  const [filters, setFilters] = useState<RevenueReportFilters>({
    fromDate: initialFilters.fromDate || defaultPreset.fromDate,
    toDate: initialFilters.toDate || defaultPreset.toDate,
    groupBy: initialFilters.groupBy || "day",
  });

  const [selectedPreset, setSelectedPreset] = useState<string>("30 ngày gần nhất");

  const handlePresetChange = (preset: string) => {
    const selected = datePresets.find((p) => p.label === preset);
    if (selected) {
      setSelectedPreset(preset);
      setFilters((prev) => ({
        ...prev,
        fromDate: selected.fromDate,
        toDate: selected.toDate,
      }));
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSelectedPreset(""); // Reset preset khi chọn custom date
  };

  const handleApply = () => {
    onFilterChange(filters);
  };

  const handleReset = () => {
    const resetFilters: RevenueReportFilters = {
      fromDate: defaultPreset.fromDate,
      toDate: defaultPreset.toDate,
      groupBy: "day",
    };
    setFilters(resetFilters);
    setSelectedPreset("30 ngày gần nhất");
    onFilterChange(resetFilters);
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      {/* Date Presets */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Khoảng thời gian nhanh
        </label>
        <div className="flex flex-wrap gap-2">
          {datePresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetChange(preset.label)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                selectedPreset === preset.label
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters Grid - Horizontal Layout */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-4">
        {/* Date Inputs */}
        <div className="flex flex-1 gap-4">
          {/* From Date */}
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Từ ngày
            </label>
            <SimpleDatePicker
              value={filters.fromDate}
              onChange={(date) => handleFilterChange("fromDate", date)}
              placeholder="yyyy-MM-dd"
            />
          </div>

          {/* To Date */}
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Đến ngày
            </label>
            <SimpleDatePicker
              value={filters.toDate}
              onChange={(date) => handleFilterChange("toDate", date)}
              placeholder="yyyy-MM-dd"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="primary" size="ssmm" onClick={handleApply}>
            <Search className="mr-2 h-4 w-4" />
            Áp dụng
          </Button>
          <Button variant="outline" size="ssmm" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Đặt lại
          </Button>
        </div>
      </div>
    </div>
  );
}
