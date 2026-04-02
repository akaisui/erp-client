"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStockTransfers, useWarehouses, useMe } from "@/hooks/api";
import { Can } from "@/components/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { SimpleDatePicker } from "@/components/form/SimpleDatePicker";
import type { Warehouse, ApiResponse, AuthUser, StockTransfer } from "@/types";
import { useDebounce } from "@/hooks";
import Pagination from "@/components/tables/Pagination";
import {
  Eye,
  Search,
  Clock,
  CheckCircle,
  Truck,
  X,
  RotateCcw,
  ArrowRight,
  Plus,
  Package,
  Printer,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type TabType = "all" | "outbound" | "inbound";

export default function StockTransfersPage() {
  const router = useRouter();
  const { data: currentUser } = useMe() as unknown as ApiResponse<AuthUser>;
  const myWarehouseId = currentUser?.warehouseId;

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState<"pending" | "in_transit" | "completed" | "cancelled" | "all">("all");
  const [fromWarehouseFilter, setFromWarehouseFilter] = useState<number | "all">("all");
  const [toWarehouseFilter, setToWarehouseFilter] = useState<number | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");

  // Fetch kho cho bộ lọc
  const { data: warehousesResponse } = useWarehouses({
    limit: 1000,
  });
  const warehouses = warehousesResponse?.data as unknown as Warehouse[] || [];

  // Apply tab filter to warehouse filters
  useEffect(() => {
    if (activeTab === "outbound" && myWarehouseId) {
      setFromWarehouseFilter(myWarehouseId);
      setToWarehouseFilter("all");
    } else if (activeTab === "inbound" && myWarehouseId) {
      setFromWarehouseFilter("all");
      setToWarehouseFilter(myWarehouseId);
    } else if (activeTab === "all") {
      setFromWarehouseFilter("all");
      setToWarehouseFilter("all");
    }
  }, [activeTab, myWarehouseId]);

  // Fetch phiếu chuyển kho
  const { data: responseWrapper, isLoading, error } = useStockTransfers({
    page,
    limit,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(fromWarehouseFilter !== "all" && { fromWarehouseId: fromWarehouseFilter }),
    ...(toWarehouseFilter !== "all" && { toWarehouseId: toWarehouseFilter }),
    ...(fromDate && { fromDate }),
    ...(toDate && { toDate }),
  });

  const response = responseWrapper as unknown as ApiResponse<StockTransfer[]>;
  const transfers = response?.data || [];
  console.log(transfers);
  const paginationMeta = response?.meta;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, fromDate, toDate]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const getStatusInfo = (status: string) => {
    const statuses: Record<string, { label: string; color: any }> = {
      pending: { label: "Chờ duyệt", color: "yellow" },
      in_transit: { label: "Đang vận chuyển", color: "purple" },
      completed: { label: "Hoàn thành", color: "green" },
      cancelled: { label: "Đã hủy", color: "red" },
    };
    return statuses[status] || { label: status, color: "gray" };
  };

  const getProgressPercentage = (status: string) => {
    const progress: Record<string, number> = {
      pending: 25,
      in_transit: 60,
      completed: 100,
      cancelled: 0,
    };
    return progress[status] || 0;
  };

  // Calculate quick stats
  const pendingCount = transfers.filter(t => t.status === "pending").length;
  const inTransitCount = transfers.filter(t => t.status === "in_transit").length;
  const completedCount = transfers.filter(t => t.status === "completed").length;
  const totalCount = transfers.length;

  // Kiểm tra có bộ lọc nào đang hoạt động
  const hasActiveFilters =
    searchTerm ||
    statusFilter !== "all" ||
    (activeTab === "all" && (fromWarehouseFilter !== "all" || toWarehouseFilter !== "all")) ||
    fromDate ||
    toDate;

  // Xóa tất cả bộ lọc
  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    if (activeTab === "all") {
      setFromWarehouseFilter("all");
      setToWarehouseFilter("all");
    }
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
        <p className="text-red-800 dark:text-red-200">
          Lỗi khi tải danh sách phiếu chuyển kho: {(error as any)?.message || "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý Phiếu Chuyển Kho
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý phiếu chuyển hàng giữa các kho trong hệ thống
          </p>
        </div>

        <Can permission="create_stock_transfers">
          <Button 
            variant="primary" 
            size="ssmm"
            onClick={() => router.push("/inventory")}
          >
            <Plus className="mr-2 h-5 w-5" />
            Tạo phiếu
          </Button>
        </Can>
      </div>

      {/* Statistics Cards - Warehouse Style */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Transfers Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-blue-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-blue-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-0" />
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          ) : (
            <>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tổng phiếu
                  </p>
                  <p className="mt-3 text-3xl font-bold text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover:scale-110">
                    {totalCount}
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                  <div className="relative border-2 border-blue-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <Package className="h-7 w-7 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-900">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Tổng số phiếu chuyển kho
                </p>
              </div>
            </>
          )}
        </div>

        {/* Pending Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-yellow-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-yellow-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -z-0" />
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          ) : (
            <>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Chờ duyệt
                  </p>
                  <p className="mt-3 text-3xl font-bold text-yellow-600 dark:text-yellow-400 transition-all duration-300 group-hover:scale-110">
                    {pendingCount}
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                  <div className="relative border-2 border-yellow-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <Clock className="h-7 w-7 text-yellow-600 dark:text-yellow-400" strokeWidth={2} />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-yellow-200 dark:border-yellow-900">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Phiếu cần cấp trên phê duyệt
                </p>
              </div>
            </>
          )}
        </div>

        {/* In Transit Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-purple-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-purple-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-0" />
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          ) : (
            <>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Đang vận chuyển
                  </p>
                  <p className="mt-3 text-3xl font-bold text-purple-600 dark:text-purple-400 transition-all duration-300 group-hover:scale-110">
                    {inTransitCount}
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                  <div className="relative border-2 border-purple-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <Truck className="h-7 w-7 text-purple-600 dark:text-purple-400" strokeWidth={2} />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-900">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Hàng đang được vận chuyển
                </p>
              </div>
            </>
          )}
        </div>

        {/* Completed Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-green-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-green-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -z-0" />
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          ) : (
            <>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Đã hoàn thành
                  </p>
                  <p className="mt-3 text-3xl font-bold text-green-600 dark:text-green-400 transition-all duration-300 group-hover:scale-110">
                    {completedCount}
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                  <div className="relative border-2 border-green-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" strokeWidth={2} />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-900">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Phiếu chuyển kho hoàn tất
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      {myWarehouseId && (
        <div className="flex gap-0 rounded-lg border border-gray-200 overflow-hidden dark:border-gray-700">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            Tất cả
          </button>
          <div className="w-px bg-gray-200 dark:bg-gray-700" />
          <button
            onClick={() => setActiveTab("outbound")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "outbound"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            Yêu cầu gửi đi
          </button>
          <div className="w-px bg-gray-200 dark:bg-gray-700" />
          <button
            onClick={() => setActiveTab("inbound")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "inbound"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            Hàng nhập về
          </button>
        </div>
      )}

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
          placeholder="Tìm theo mã phiếu..."
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filters - Warehouse Style */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {/* Status Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="in_transit">Đang vận chuyển</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          {/* From Warehouse Filter - Only show in "All" tab */}
          {activeTab === "all" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kho đi
              </label>
              <SearchableSelect
                options={[
                  { value: "all", label: "Tất cả kho" },
                  ...warehouses.map((w) => ({
                    value: w.id,
                    label: `${w.warehouseName}`,
                  })),
                ]}
                value={fromWarehouseFilter}
                onChange={(value) => setFromWarehouseFilter(value as any)}
                placeholder="Chọn kho đi..."
              />
            </div>
          )}

          {/* To Warehouse Filter - Only show in "All" tab */}
          {activeTab === "all" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kho đến
              </label>
              <SearchableSelect
                options={[
                  { value: "all", label: "Tất cả kho" },
                  ...warehouses.map((w) => ({
                    value: w.id,
                    label: `${w.warehouseName}`,
                  })),
                ]}
                value={toWarehouseFilter}
                onChange={(value) => setToWarehouseFilter(value as any)}
                placeholder="Chọn kho đến..."
              />
            </div>
          )}

          {/* From Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Từ ngày
            </label>
            <SimpleDatePicker
              value={fromDate}
              onChange={setFromDate}
              placeholder="Chọn ngày bắt đầu..."
            />
          </div>

          {/* To Date */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Đến ngày
            </label>
            <SimpleDatePicker
              value={toDate}
              onChange={setToDate}
              placeholder="Chọn ngày kết thúc..."
            />
          </div>

          {/* Items per page */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hiển thị
            </label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Bộ lọc:
            </span>

            {searchTerm && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                🔍 "{searchTerm}"
                <button
                  onClick={() => setSearchTerm("")}
                  className="hover:text-blue-900 dark:hover:text-blue-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                Trạng thái: {getStatusInfo(statusFilter).label}
                <button
                  onClick={() => setStatusFilter("all")}
                  className="hover:text-purple-900 dark:hover:text-purple-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {fromWarehouseFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                Kho đi: {warehouses.find((w) => w.id === fromWarehouseFilter)?.warehouseName || fromWarehouseFilter}
                <button
                  onClick={() => setFromWarehouseFilter("all")}
                  className="hover:text-indigo-900 dark:hover:text-indigo-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {toWarehouseFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                Kho đến: {warehouses.find((w) => w.id === toWarehouseFilter)?.warehouseName || toWarehouseFilter}
                <button
                  onClick={() => setToWarehouseFilter("all")}
                  className="hover:text-indigo-900 dark:hover:text-indigo-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {fromDate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-3 py-1 text-sm text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400">
                Từ ngày: {fromDate}
                <button
                  onClick={() => setFromDate("")}
                  className="hover:text-cyan-900 dark:hover:text-cyan-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {toDate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-3 py-1 text-sm text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400">
                Đến ngày: {toDate}
                <button
                  onClick={() => setToDate("")}
                  className="hover:text-cyan-900 dark:hover:text-cyan-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RotateCcw className="h-3 w-3" />
              Xóa tất cả
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
      ) : transfers.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <Package className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Không tìm thấy phiếu chuyển kho nào</p>
        </div>
      ) : (
            <Table>
              <TableHeader className="border-b-1 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <TableRow>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Mã phiếu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Lộ trình
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Ngày chuyển
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tổng giá trị
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Người yêu cầu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tiến độ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Thao tác
                  </th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => {
                  const statusInfo = getStatusInfo(transfer.status);
                  const progressPercent = getProgressPercentage(transfer.status);
                  
                  return (
                    <TableRow key={transfer.id}>
                      {/* Mã phiếu */}
                      <TableCell className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        <Link
                          href={`/inventory/stock-transfers/${transfer.id}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                        >
                          {transfer.transferCode}
                        </Link>
                      </TableCell>

                      {/* Lộ trình */}
                      <TableCell className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 dark:text-gray-300 max-w-xs" title={transfer.fromWarehouse?.warehouseName}>
                            {transfer.fromWarehouse?.warehouseName}
                          </span>
                          <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 max-w-xs" title={transfer.toWarehouse?.warehouseName}>
                            {transfer.toWarehouse?.warehouseName}
                          </span>
                        </div>
                      </TableCell>

                      {/* Ngày chuyển */}
                      <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {transfer.transferDate
                          ? format(new Date(transfer.transferDate), "dd/MM/yyyy")
                          : format(new Date(transfer.createdAt), "dd/MM/yyyy")}
                      </TableCell>

                      {/* Tổng giá trị (Chỉ Admin/Kế toán) */}
                      <Can permission="view_financial_reports">
                        <TableCell className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                            maximumFractionDigits: 0,
                          }).format(Number(transfer.totalValue || 0))}
                        </TableCell>
                      </Can>

                      {/* Người yêu cầu */}
                      <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {transfer.requestedBy ? (
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {transfer.requester?.fullName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {transfer.requester?.employeeCode}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>

                      {/* Trạng thái */}
                      <TableCell className="px-6 py-4 text-sm">
                        <Badge color={statusInfo.color as any}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>

                      {/* Tiến độ */}
                      <TableCell className="px-6 py-4 text-sm">
                        <div className="w-32">
                          <div className="h-2 rounded-full bg-gray-200 overflow-hidden dark:bg-gray-700">
                            <div
                              className={`h-full transition-all ${
                                statusInfo.color === "green"
                                  ? "bg-green-500"
                                  : statusInfo.color === "purple"
                                  ? "bg-purple-500"
                                  : statusInfo.color === "yellow"
                                  ? "bg-yellow-500"
                                  : "bg-gray-400"
                              }`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                            {progressPercent}%
                          </p>
                        </div>
                      </TableCell>

                      {/* Thao tác */}
                      <TableCell className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/inventory/stock-transfers/${transfer.id}`}
                            className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                            title="Xem"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {/* Duyệt nhanh - Nếu Admin và status Pending */}
                          <Can permission="approve_stock_transfers">
                            {transfer.status === "pending" && (
                              <button
                                className="rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                title="Duyệt nhanh"
                                onClick={() => {
                                  alert(`Duyệt phiếu ${transfer.transferCode}`);
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                          </Can>

                          {/* In phiếu */}
                          <button
                            className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="In phiếu"
                            onClick={() => {
                              window.print();
                            }}
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
      </div>

      {/* Pagination */}
      {paginationMeta && paginationMeta.total > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Hiển thị{" "}
            <span className="font-medium">
              {(paginationMeta.page - 1) * paginationMeta.limit + 1}
            </span>{" "}
            đến{" "}
            <span className="font-medium">
              {Math.min(
                paginationMeta.page * paginationMeta.limit,
                paginationMeta.total
              )}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-medium">{paginationMeta.total}</span> phiếu chuyển
          </div>
          {paginationMeta.totalPages > 1 && (
            <Pagination
              currentPage={paginationMeta.page}
              totalPages={paginationMeta.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
