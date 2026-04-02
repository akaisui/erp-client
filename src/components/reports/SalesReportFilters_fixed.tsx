"use client";

import React, { useState, useMemo, useCallback } from "react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
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
  const { token } = useAuthStore();
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
    queryKey: ["sales-staff"],
    queryFn: async () => {
      const response = await axios.get("http://localhost:5000/api/users", {
        params: {
          role: "sales_staff",
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

  const handleDatePresetChange = useCallback(
    (preset: DatePreset) => {
      setDatePreset(preset);
      let newFromDate = format(startOfMonth(today), "yyyy-MM-dd");
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
          newFromDate = format(startOfMonth(today), "yyyy-MM-dd");
          break;
        case "lastMonth":
          const lastMonth = subMonths(today, 1);
          newFromDate = format(startOfMonth(lastMonth), "yyyy-MM-dd");
          newToDate = format(endOfMonth(lastMonth), "yyyy-MM-dd");
          break;
      }

      setFilters((prev) => ({
        ...prev,
        fromDate: newFromDate,
        toDate: newToDate,
      }));
    },
    [today]
  );

  const handleApply = useCallback(() => {
    const updatedFilters = {
      ...filters,
      ...(selectedCustomer && { customerId: selectedCustomer.id }),
      ...(selectedStaff && { createdBy: selectedStaff.id }),
    };
    onFilterChange(updatedFilters);
  }, [filters, selectedCustomer, selectedStaff, onFilterChange]);

  const handleReset = useCallback(() => {
    setDatePreset("thisMonth");
    setFilters({
      fromDate: format(startOfMonth(today), "yyyy-MM-dd"),
      toDate: format(today, "yyyy-MM-dd"),
    });
    setCustomerSearch("");
    setSelectedCustomer(null);
    setStaffSearch("");
    setSelectedStaff(null);
    onFilterChange({
      fromDate: format(startOfMonth(today), "yyyy-MM-dd"),
      toDate: format(today, "yyyy-MM-dd"),
    });
  }, [today, onFilterChange]);

  const getDefaultWarehouse = useMemo(
    () => warehouses[0] || { id: 0, warehouseName: "Tất cả kho" },
    [warehouses]
  );

  return (
    <div className="space-y-4 rounded-lg bg-white p-6 dark:bg-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Bộ lọc báo cáo</h3>

      {/* Row 1: Date & Warehouse */}
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Khoảng thời gian
          </label>
          <SimpleDatePicker
            value={filters.fromDate}
            onChange={(date) => setFilters((prev) => ({ ...prev, fromDate: date }))}
            placeholder="Từ ngày"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Đến ngày
          </label>
          <SimpleDatePicker
            value={filters.toDate}
            onChange={(date) => setFilters((prev) => ({ ...prev, toDate: date }))}
            placeholder="Đến ngày"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nhanh
          </label>
          <select
            value={datePreset}
            onChange={(e) => handleDatePresetChange(e.target.value as DatePreset)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
          >
            {DATE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Customer & Staff Search */}
      <div className="grid gap-4 md:grid-cols-2">
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
              placeholder="Nhập tên, SĐT..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
            />
            {selectedCustomer && (
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setCustomerSearch("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          {showCustomerDropdown && customersData && customersData.length > 0 && (
            <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
              {customersData.map((customer: any) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setCustomerSearch("");
                    setShowCustomerDropdown(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  {customer.customerName} - {customer.phone}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nhân viên bán hàng
          </label>
          <select
            value={selectedStaff?.id || ""}
            onChange={(e) => {
              if (!e.target.value) {
                setSelectedStaff(null);
              } else {
                const staff = staffData?.find((s: any) => s.id === parseInt(e.target.value));
                setSelectedStaff(staff);
              }
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
          >
            <option value="">Tất cả nhân viên</option>
            {staffData?.map((staff: any) => (
              <option key={staff.id} value={staff.id}>
                {staff.fullName} ({staff.employeeCode || staff.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 3: Channels & Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Kênh bán hàng
          </label>
          <select
            value={filters.salesChannel || ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, salesChannel: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
          >
            {SALES_CHANNELS.map((ch) => (
              <option key={ch.value} value={ch.value}>
                {ch.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Trạng thái đơn
          </label>
          <select
            value={filters.orderStatus || ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, orderStatus: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
          >
            {ORDER_STATUSES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleApply}
          disabled={isLoading}
          className="flex-1"
        >
          <Filter className="mr-2 h-4 w-4" />
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
        {onExport && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport("excel")}
              disabled={isLoading}
            >
              <Download className="mr-2 h-4 w-4" />
              Xuất Excel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
