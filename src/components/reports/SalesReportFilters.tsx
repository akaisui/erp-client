"use client";

import React, { useState, useMemo, useCallback } from "react";
import { format, subDays, startOfMonth, startOfWeek, endOfMonth, subMonths } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Button from "@/components/ui/button/Button";
import { SimpleDatePicker } from "@/components/form/SimpleDatePicker";
import { Filter, RotateCcw, Download, X } from "lucide-react";
import { useAuthStore } from "@/stores";
import type { SalesReportFilters, DatePreset } from "@/types/report.types";

interface SalesReportFiltersProps {
  onFilterChange: (filters: SalesReportFilters) => void;
  onExport?: (format: "excel" | "pdf") => void;
  warehouses?: Array<{ id: number; warehouseName: string }>;
  isLoading?: boolean;
}

const DATE_PRESETS: Array<{ label: string; value: DatePreset }> = [
  { label: "Hôm nay", value: "today" },
  { label: "Hôm qua", value: "yesterday" },
  { label: "7 ngày qua", value: "thisWeek" },
  { label: "Tháng này", value: "thisMonth" },
  { label: "Tháng trước", value: "lastMonth" },
  { label: "Tùy chỉnh", value: "custom" },
];

const SALES_CHANNELS: Array<{ label: string; value: string }> = [
  { label: "Tất cả kênh", value: "" },
  { label: "Bán lẻ", value: "retail" },
  { label: "Bán sỉ", value: "wholesale" },
  { label: "Online", value: "online" },
  { label: "Đại lý", value: "distributor" },
];

const ORDER_STATUSES: Array<{ label: string; value: string }> = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Chờ xác nhận", value: "pending" },
  { label: "Đang chuẩn bị", value: "preparing" },
  { label: "Đang giao", value: "delivering" },
  { label: "Hoàn thành", value: "completed" },
  { label: "Đã hủy", value: "cancelled" },
];

export default function SalesReportFilters({
  onFilterChange,
  onExport,
  warehouses = [],
  isLoading = false,
}: SalesReportFiltersProps) {
  const today = new Date();
  const [datePreset, setDatePreset] = useState<DatePreset>("thisMonth");
  const [filters, setFilters] = useState<SalesReportFilters>({
    fromDate: format(startOfMonth(today), "yyyy-MM-dd"),
    toDate: format(today, "yyyy-MM-dd"),
  });

  // Autocomplete states
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [staffSearch, setStaffSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);

  // Get token from Zustand store
  const { token } = useAuthStore();

  // Fetch customers for autocomplete
  const { data: customersData } = useQuery({
    queryKey: ["customers", customerSearch],
    queryFn: async () => {
      if (!customerSearch.trim()) return [];
      const response = await axios.get("http://localhost:5000/api/customers", {
        params: {
          search: customerSearch,
          limit: 10,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data?.data || [];
    },
    enabled: customerSearch.length > 0 && !!token,
  });

  // Fetch sales staff for dropdown
  const { data: staffData } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/users", {
        params: {
          limit: 100,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data?.data || [];
    },
    enabled: !!token,
  });

  // Calculate date range based on preset
  const calculateDateRange = (preset: DatePreset) => {
    let fromDate = today;
    let toDate = today;

    switch (preset) {
      case "today":
        fromDate = today;
        toDate = today;
        break;
      case "yesterday":
        fromDate = subDays(today, 1);
        toDate = subDays(today, 1);
        break;
      case "thisWeek":
        fromDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        toDate = today;
        break;
      case "thisMonth":
        fromDate = startOfMonth(today);
        toDate = today;
        break;
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        fromDate = startOfMonth(lastMonth);
        toDate = endOfMonth(lastMonth);
        break;
      case "custom":
        break;
    }

    return {
      fromDate: format(fromDate, "yyyy-MM-dd"),
      toDate: format(toDate, "yyyy-MM-dd"),
    };
  };

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== "custom") {
      const dateRange = calculateDateRange(preset);
      setFilters((prev) => ({
        ...prev,
        ...dateRange,
      }));
    }
  };

  const handleReset = () => {
    const defaultFilters: SalesReportFilters = {
      fromDate: format(startOfMonth(today), "yyyy-MM-dd"),
      toDate: format(today, "yyyy-MM-dd"),
    };
    setDatePreset("thisMonth");
    setFilters(defaultFilters);
    setSelectedCustomer(null);
    setSelectedStaff(null);
    setCustomerSearch("");
    setStaffSearch("");
    onFilterChange(defaultFilters);
  };

  const handleApply = () => {
    const updatedFilters = {
      ...filters,
      ...(selectedCustomer && { customerId: selectedCustomer.id }),
      ...(selectedStaff && { createdBy: selectedStaff.id }),
    };
    onFilterChange(updatedFilters);
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bộ lọc báo cáo
          </h2>
        </div>
        {onExport && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport("excel")}
              disabled={isLoading}
            >
              <Download className="mr-2 h-4 w-4" />
              Xuất Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport("pdf")}
              disabled={isLoading}
            >
              <Download className="mr-2 h-4 w-4" />
              In PDF
            </Button>
          </div>
        )}
      </div>

      {/* 2-Row Filter Layout */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        {/* ROW 1: Thời gian & Kho */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
          {/* From Date - To Date (combined) */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Khoảng thời gian
            </label>
            <div className="flex gap-2 items-end">
              <SimpleDatePicker
                value={filters.fromDate}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, fromDate: value }))
                }
                placeholder="Từ ngày"
                disabled={isLoading}
              />
              <span className="text-gray-400">-</span>
              <SimpleDatePicker
                value={filters.toDate}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, toDate: value }))
                }
                placeholder="Đến ngày"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Warehouse */}
          {warehouses.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kho/Chi nhánh
              </label>
              <select
                value={filters.warehouseId || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    warehouseId: e.target.value ? parseInt(e.target.value) : undefined,
                  }))
                }
                disabled={isLoading}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              >
                <option value="">Tất cả kho</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.warehouseName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nhanh
            </label>
            <select
              value={datePreset}
              onChange={(e) => handlePresetChange(e.target.value as DatePreset)}
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            >
              {DATE_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ROW 2: Khách hàng, Nhân viên, Kênh, Trạng thái */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Customer Autocomplete */}
          <div className="relative">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Khách hàng
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedCustomer ? selectedCustomer.customerName : customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                placeholder="Nhập tên, SĐT..."
                disabled={isLoading}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              />
              {selectedCustomer && (
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearch("");
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Customer Dropdown */}
              {showCustomerDropdown && customerSearch && customersData?.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700 z-20">
                  {customersData.map((customer: any) => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCustomerSearch("");
                        setShowCustomerDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 border-b last:border-b-0 border-gray-200 dark:border-gray-600"
                    >
                      <div className="font-medium">{customer.customerName}</div>
                      <div className="text-xs text-gray-500">{customer.phone || customer.customerCode}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Staff Select */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nhân viên bán hàng
            </label>
            <select
              value={selectedStaff?.id || ""}
              onChange={(e) => {
                const id = e.target.value ? parseInt(e.target.value) : null;
                setSelectedStaff(id ? staffData?.find((s: any) => s.id === id) : null);
              }}
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            >
              <option value="">Tất cả nhân viên</option>
              {staffData?.map((staff: any) => (
                <option key={staff.id} value={staff.id}>
                  {staff.fullName} ({staff.employeeCode})
                </option>
              ))}
            </select>
          </div>

          {/* Sales Channel */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Kênh bán hàng
            </label>
            <select
              value={filters.salesChannel || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  salesChannel: (e.target.value as any) || undefined,
                }))
              }
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            >
              {SALES_CHANNELS.map((channel) => (
                <option key={channel.value || "all"} value={channel.value}>
                  {channel.label}
                </option>
              ))}
            </select>
          </div>

          {/* Order Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Trạng thái đơn
            </label>
            <select
              value={filters.orderStatus || ""}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  orderStatus: (e.target.value as any) || undefined,
                }))
              }
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50"
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status.value || "all"} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={handleApply}
            disabled={isLoading}
          >
            Lọc dữ liệu
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Đặt lại
          </Button>
        </div>
      </div>
    </div>
  );
}
