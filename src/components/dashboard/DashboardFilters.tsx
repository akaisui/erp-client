import React, { useState } from "react";
import { Calendar, Building2, ChevronDown } from "lucide-react";
import { SimpleDatePicker } from "../form/SimpleDatePicker";
import SearchableSelect from "../ui/SearchableSelect";
import { useWarehouses } from "@/hooks/api/useWarehouses";
import { Warehouse } from "@/types";

interface DashboardFiltersProps {
  onPeriodChange?: (period: "today" | "week" | "month" | "custom") => void;
  onDateRangeChange?: (fromDate: string, toDate: string) => void;
  onWarehouseChange?: (warehouseId: number | null) => void;
  selectedPeriod?: "today" | "week" | "month" | "custom";
  selectedWarehouse?: number | null;
  isAdmin?: boolean;
}

export function DashboardFilters({
  onPeriodChange,
  onDateRangeChange,
  onWarehouseChange,
  selectedPeriod = "month",
  selectedWarehouse = null,
  isAdmin = false,
}: DashboardFiltersProps) {
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Fetch warehouses
  const { data: warehousesWrapper } = useWarehouses({ page: 1, limit: 100 }); // Fetch all (reasonable limit)
  const warehouses = warehousesWrapper?.data as unknown as Warehouse[];

  const handleCustomDateApply = () => {
    if (fromDate && toDate) {
      onDateRangeChange?.(fromDate, toDate);
      onPeriodChange?.("custom");
      setShowCustomDate(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-4">
      {/* Time Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        <div className="flex gap-2 flex-wrap">
          {(["today", "week", "month"] as const).map((period) => (
            <button
              key={period}
              onClick={() => {
                onPeriodChange?.(period);
                setShowCustomDate(false);
              }}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                selectedPeriod === period
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {period === "today" && "Hôm nay"}
              {period === "week" && "Tuần này"}
              {period === "month" && "Tháng này"}
            </button>
          ))}
        </div>

        {/* Custom Date Button */}
        <div className="relative">
          <button
            onClick={() => setShowCustomDate(!showCustomDate)}
            className={`rounded px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
              selectedPeriod === "custom"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            Tùy chọn
            <ChevronDown className="h-4 w-4" />
          </button>

          {/* Custom Date Picker Dropdown */}
          {showCustomDate && (
            <div className="absolute right-0 mt-2 w-72 rounded-lg bg-white p-4 shadow-lg dark:bg-gray-700 z-50 border border-gray-200 dark:border-gray-600">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Từ ngày
                  </label>
                  <SimpleDatePicker
                    value={fromDate}
                    onChange={setFromDate}
                    placeholder="Chọn ngày bắt đầu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Đến ngày
                  </label>
                  <SimpleDatePicker
                    value={toDate}
                    onChange={setToDate}
                    placeholder="Chọn ngày kết thúc"
                    minDate={fromDate}
                  />
                </div>
                <button
                  onClick={handleCustomDateApply}
                  className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Warehouse Filter (Admin only) */}
      {isAdmin && (
        <div className="flex items-center gap-2 flex-shrink-0 w-64">
          <Building2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <div className="flex-1">
            <SearchableSelect
              options={[
                { value: "", label: "Tất cả kho" },
                ...(warehouses?.map((w) => ({
                  value: w.id,
                  label: w.warehouseName,
                })) || []),
              ]}
              value={selectedWarehouse || ""}
              onChange={(val) =>
                onWarehouseChange?.(val && val !== "all" ? Number(val) : null)
              }
              placeholder="Chọn kho..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
