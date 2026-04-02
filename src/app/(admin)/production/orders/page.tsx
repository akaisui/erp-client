"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useProductionOrders, useDeleteProductionOrder, useWarehouses } from "@/hooks/api";
import { Can } from "@/components/auth";
import Button from "@/components/ui/button/Button";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { SimpleDatePicker } from "@/components/form/SimpleDatePicker";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { ApiResponse, ProductionOrder, ProductionStatus, Warehouse } from "@/types";
import { Plus, Eye, Trash2, AlertCircle, Zap, TrendingUp, Clock, X, Printer, Search, FileText, RotateCcw, Download, CheckCircle2, Check, Play, Edit2, XCircle, Flag, MoreVertical, Edit } from "lucide-react";
import { PRODUCTION_STATUS_LABELS, PRODUCTION_STATUS_COLORS } from "@/lib/constants";
import { format, isAfter, startOfWeek, endOfWeek } from "date-fns";
import { formatNumber } from "@/lib/utils";
import { useDebounce } from "@/hooks";
import { handleExportPDF } from "@/lib/pdf";
import Pagination from "@/components/tables/Pagination";
import { handleExportExcel } from "@/lib/excel";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";

export default function ProductionOrdersPage() {
  // Pagination & Filter
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState<ProductionStatus | "all">("all");
  const [warehouseFilter, setWarehouseFilter] = useState<number | "all">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState<{ id: number; orderCode: string } | null>(null);
  
  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Fetch Production Orders
  const { data, isLoading, error } = useProductionOrders({
    page,
    limit,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(warehouseFilter !== "all" && { warehouseId: warehouseFilter }),
    ...(startDate && { startDate: startDate }),
    ...(endDate && { endDate: endDate }),
  });
  const response = data as unknown as ApiResponse<ProductionOrder[]>;
  const productionOrders = response?.data || [];

  const paginationMeta = response?.meta;

  // Fetch Warehouses
  const { data: warehousesData } = useWarehouses({ limit: 1000 });
  const warehouses = (warehousesData as unknown as ApiResponse<Warehouse[]>)?.data || [];

  const deleteOrder = useDeleteProductionOrder();

  useEffect(() => {
      setPage(1);
    }, [debouncedSearch, statusFilter, warehouseFilter, startDate, endDate]);
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!productionOrders) return { pending: 0, inProgress: 0, overdue: 0, weeklyOutput: 0 };

    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    const pending = productionOrders.filter(o => o.status === "pending").length;
    const inProgress = productionOrders.filter(o => o.status === "in_progress").length;
    
    const overdue = productionOrders.filter(o => {
      if (o.status !== "in_progress" || !o.endDate) return false;
      return isAfter(now, new Date(o.endDate));
    }).length;

    const weeklyOutput = productionOrders.reduce((total, o) => {
      if (o.status === "completed" && o.completedAt) {
        const completedDate = new Date(o.completedAt);
        if (completedDate >= weekStart && completedDate <= weekEnd) {
          return total + (o.actualQuantity || 0);
        }
      }
      return total;
    }, 0);

    return { pending, inProgress, overdue, weeklyOutput };
  }, [productionOrders]);

  // Handle Delete
  const handleDeleteClick = (id: number, orderCode: string) => {
    setDeletingOrder({ id, orderCode });
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingOrder) return;
    deleteOrder.mutate(deletingOrder.id);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingOrder(null);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setWarehouseFilter("all");
    setStartDate("");
    setEndDate("");
  };

  // Filter by status
  const filterByStatus = (status: ProductionStatus) => {
    setStatusFilter(status);
  };
  
  // Kiểm tra nếu filter active
  const hasActiveFilters = searchTerm || statusFilter !== "all" || warehouseFilter !== "all" || startDate || endDate;


  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <h3 className="font-semibold text-red-900 dark:text-red-300">
          Lỗi khi tải danh sách lệnh sản xuất
        </h3>
        <p className="mt-1 text-sm text-red-800 dark:text-red-400">
          {(error as any)?.message || "Đã có lỗi xảy ra"}
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
            Lệnh Sản Xuất
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý lệnh sản xuất và theo dõi tiến độ
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="smm" 
            onClick={() => handleExportExcel(productionOrders || [])}
            disabled={!productionOrders || productionOrders.length === 0}
            title="Xuất danh sách ra Excel"
          >
            <Download className="mr-2 h-5 w-5" />
            Xuất Excel
          </Button>

          <Button 
            variant="outline" 
            size="smm" 
            onClick={() => handleExportPDF(productionOrders || [])}
            disabled={!productionOrders || productionOrders.length === 0}
            title="Xuất danh sách để in"
          >
            <Printer className="mr-2 h-5 w-5" />
            In kế hoạch
          </Button>

          <Can permission="create_production_order">
            <Link href="/production/orders/create">
              <Button size="smm" variant="primary">
                <Plus className="mr-2 h-5 w-5" />
                Tạo lệnh sản xuất
              </Button>
            </Link>
          </Can>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Chờ phê duyệt (Pending) */}
        <div 
          onClick={() => filterByStatus("pending")}
          className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-amber-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer dark:border-gray-800 dark:from-gray-900 dark:to-amber-950"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -z-0" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Chờ phê duyệt
              </p>
              <p className="mt-3 text-3xl font-bold text-amber-600 dark:text-amber-400 transition-all duration-300 group-hover:scale-110">
                {metrics.pending}
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative border-2 border-amber-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Clock className="h-7 w-7 text-amber-600 dark:text-amber-400" strokeWidth={2} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-900">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Đợi duyệt trước khi sản xuất
            </p>
          </div>
        </div>

        {/* Card 2: Đang sản xuất (In Progress) */}
        <div 
          onClick={() => filterByStatus("in_progress")}
          className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-blue-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer dark:border-gray-800 dark:from-gray-900 dark:to-blue-950"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-0" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Đang sản xuất
              </p>
              <p className="mt-3 text-3xl font-bold text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover:scale-110">
                {metrics.inProgress}
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative border-2 border-blue-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Zap className="h-7 w-7 text-blue-600 dark:text-blue-400" strokeWidth={2} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-900">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Lệnh đang chạy
            </p>
          </div>
        </div>

        {/* Card 3: Trễ tiến độ (Overdue) */}
        <div 
          onClick={() => setStatusFilter("in_progress")}
          className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-red-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer dark:border-gray-800 dark:from-gray-900 dark:to-red-950"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -z-0" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Trễ tiến độ
              </p>
              <p className="mt-3 text-3xl font-bold text-red-600 dark:text-red-400 transition-all duration-300 group-hover:scale-110">
                {metrics.overdue}
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative border-2 border-red-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" strokeWidth={2} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-900">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {metrics.overdue > 0 ? 'Cần xử lý ngay ⚠️' : 'Không có lệnh trễ'}
            </p>
          </div>
        </div>

        {/* Card 4: Hiệu suất tuần này (Weekly Output) */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-purple-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-purple-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-0" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Hiệu suất tuần này
              </p>
              <p className="mt-3 text-3xl font-bold text-purple-600 dark:text-purple-400 transition-all duration-300 group-hover:scale-110">
                {formatNumber(metrics.weeklyOutput)}
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative border-2 border-purple-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <TrendingUp className="h-7 w-7 text-purple-600 dark:text-purple-400" strokeWidth={2} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-900">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Sản lượng hoàn thành
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {/* Search */}
          <div>
            <label
              htmlFor="search"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Tìm kiếm
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                placeholder="Mã lệnh, sản phẩm, SKU..."
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Trạng thái
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProductionStatus | "all")}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ duyệt</option>
              <option value="in_progress">Đang chạy</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          {/* Warehouse Filter */}
          <div>
            <label
              htmlFor="warehouse"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Kho đích
            </label>
            <SearchableSelect
              options={[
                { value: "", label: "Tất cả kho" },
                ...warehouses.map((w) => ({
                  value: w.id,
                  label: `${w.warehouseName} (${w.warehouseCode})`,
                })),
              ]}
              value={warehouseFilter === "all" ? "" : String(warehouseFilter)}
              onChange={(value) => {
                if (value === "") {
                  setWarehouseFilter("all");
                } else {
                  setWarehouseFilter(Number(value));
                }
              }}
              placeholder="Tìm kiếm kho..."
              isClearable
            />
          </div>

          {/* Start Date */}
          <div>
            <label
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Từ ngày
            </label>
            <SimpleDatePicker
              className="h-9"
              value={startDate || null}
              onChange={(value) => setStartDate(value)}
              placeholder="Chọn ngày bắt đầu"
            />
          </div>

          {/* End Date */}
          <div>
            <label
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Đến ngày
            </label>
            <SimpleDatePicker
              className="h-9"
              value={endDate || null}
              onChange={(value) => setEndDate(value)}
              placeholder="Chọn ngày kết thúc"
            />
          </div>

          {/* Items per page */}
          <div>
            <label
              htmlFor="limit"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Hiển thị
            </label>
            <select
              id="limit"
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

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
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
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                Trạng thái: {PRODUCTION_STATUS_LABELS[statusFilter]}
                <button
                  onClick={() => setStatusFilter("all")}
                  className="hover:text-amber-900 dark:hover:text-amber-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {warehouseFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                Kho: {warehouses.find((w) => w.id === warehouseFilter)?.warehouseName || warehouseFilter}
                <button
                  onClick={() => setWarehouseFilter("all")}
                  className="hover:text-purple-900 dark:hover:text-purple-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {(startDate || endDate) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                📅 {startDate && new Date(startDate).toLocaleDateString("vi-VN")}
                {startDate && endDate && " - "}
                {endDate && new Date(endDate).toLocaleDateString("vi-VN")}
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="hover:text-green-900 dark:hover:text-green-300"
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

      {/* Production Orders Table */}
      <div className="overflow-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : productionOrders.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <FileText className="mb-4 h-12 w-12" />
            <p>Không tìm thấy lệnh sản xuất nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-72">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Mã Lệnh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Sản Phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Công Thức
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tiến Độ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Kho Nhập
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Ngày Tháng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Trạng Thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Nguyên Liệu
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Thao Tác
                  </th>
                </tr>
              </thead>
               <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {productionOrders.map((order) => {
                  const progress = order.plannedQuantity > 0 ? (order.actualQuantity || 0) / order.plannedQuantity * 100 : 0;
                  const isOverdue = order.endDate && isAfter(new Date(), new Date(order.endDate)) && order.status === "in_progress";
                  
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      {/* Mã Lệnh */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <Link
                          href={`/production/orders/${order.id}`}
                          className="text-sm font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          {order.orderCode}
                        </Link>
                      </td>

                      {/* Sản Phẩm */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {order.finishedProduct?.productName || "—"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {order.finishedProduct?.sku || ""}
                          </div>
                        </div>
                      </td>

                      {/* Công Thức */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {order.bom?.bomCode || "—"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            v{order.bom?.version || "1.0"}
                          </div>
                        </div>
                      </td>

                      {/* Tiến Độ */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
                              <div
                                className="h-full bg-green-500 dark:bg-green-400 transition-all"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {formatNumber(order.actualQuantity || 0)}/{formatNumber(order.plannedQuantity)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </td>

                      {/* Kho Nhập */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {order.warehouse?.warehouseName || "—"}
                        </span>
                      </td>

                      {/* Ngày Tháng */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {format(new Date(order.startDate), "dd/MM/yyyy")}
                          </div>
                          {order.endDate && (
                            <div className={`text-xs ${isOverdue ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-500 dark:text-gray-400"}`}>
                              {format(new Date(order.endDate), "dd/MM/yyyy")}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Trạng Thái */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            PRODUCTION_STATUS_COLORS[order.status]
                          }`}
                        >
                          {PRODUCTION_STATUS_LABELS[order.status]}
                        </span>
                      </td>

                      {/* Nguyên Liệu */}
                      <td className="whitespace-nowrap px-6 py-4">
                        {order.status === "pending" ? (
                          <div title="Đủ hàng để sản xuất" className="inline-flex items-center justify-center">
                            {
                              order.materialAvailability?.status === "sufficient" ? (
                                <Check className="h-6 w-6 text-green-500" />
                              ) : (
                                <span title="Thiếu hàng">
                                  <X className="h-6 w-6 text-red-500" />
                                </span>
                              )
                            }
                          </div>
                        ) : (
                          <div title="Không áp dụng" className="text-gray-400 dark:text-gray-600">
                            —
                          </div>
                        )}
                      </td>

                      {/* Thao Tác */}
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end">
                          {/* View Details */}
                          <Link
                            href={`/production/orders/${order.id}`}
                            className="p-1 text-blue-500 hover:text-blue-600 dark:hover:text-blue-200"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>

                          <button
                            onClick={() =>
                              setOpenDropdownId(
                                openDropdownId === order.id ? null : order.id
                              )
                            }
                            className="dropdown-toggle p-1 text-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                            title="Thêm thao tác"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>

                          <Dropdown
                            isOpen={openDropdownId === order.id}
                            onClose={() => setOpenDropdownId(null)}
                            className="w-48"
                          >
                            <DropdownItem
                              tag="a"
                              href={`/production/orders/${order.id}`}
                              onItemClick={() => setOpenDropdownId(null)}
                              className="dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                <span>Xem chi tiết</span>
                              </div>
                            </DropdownItem>

                            {/* PENDING: Bắt đầu, Sửa, Xóa */}
                            {order.status === "pending" && (
                              <>
                                <DropdownItem
                                  tag="a"
                                  href={`/production/orders/${order.id}/start`}
                                  onItemClick={() => setOpenDropdownId(null)}
                                  className="text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                                >
                                  <div className="flex items-center gap-2">
                                    <Play className="h-4 w-4" />
                                    <span>Bắt đầu sản xuất</span>
                                  </div>
                                </DropdownItem>

                                <DropdownItem
                                  tag="a"
                                  href={`/production/orders/${order.id}/edit`}
                                  onItemClick={() => setOpenDropdownId(null)}
                                  className=" hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                >
                                  <div className="flex items-center gap-2 text-blue-600">
                                    <Edit className="h-4 w-4" />
                                    <span>Sửa lệnh</span>
                                  </div>
                                </DropdownItem>

                                <Can permission="delete_production_order">
                                  <DropdownItem
                                    onClick={() => {
                                      handleDeleteClick(order.id, order.orderCode);
                                      setOpenDropdownId(null);
                                    }}
                                    className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Trash2 className="h-4 w-4" />
                                      <span>Xóa lệnh</span>
                                    </div>
                                  </DropdownItem>
                                </Can>
                              </>
                            )}

                            {/* IN_PROGRESS: Hoàn thành, In phiếu */}
                            {order.status === "in_progress" && (
                              <>
                                <DropdownItem
                                  tag="a"
                                  href={`/production/orders/${order.id}/finish`}
                                  onItemClick={() => setOpenDropdownId(null)}
                                  className="text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                                >
                                  <div className="flex items-center gap-2">
                                    <Check className="h-4 w-4" />
                                    <span>Hoàn thành sản xuất</span>
                                  </div>
                                </DropdownItem>

                                <DropdownItem
                                  onClick={() => setOpenDropdownId(null)}
                                  className="text-blue-600! hover:bg-blue-50! dark:text-blue-500 dark:hover:bg-blue-900/20!"
                                >
                                  <div className="flex items-center gap-2">
                                    <Printer className="h-4 w-4" />
                                    <span>In phiếu sản xuất</span>
                                  </div>
                                </DropdownItem>
                              </>
                            )}

                            {/* COMPLETED: In nhãn */}
                            {order.status === "completed" && (
                              <DropdownItem
                                onClick={() => setOpenDropdownId(null)}
                                className="dark:text-gray-300 dark:hover:bg-gray-700"
                              >
                                <div className="flex items-center gap-2">
                                  <Flag className="h-4 w-4" />
                                  <span>In nhãn dán</span>
                                </div>
                              </DropdownItem>
                            )}
                          </Dropdown>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {paginationMeta && paginationMeta.total > 0 && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
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
            <span className="font-medium">{paginationMeta.total}</span> lệnh sản xuất
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Xóa lệnh sản xuất"
        message={`Bạn có chắc chắn muốn xóa lệnh sản xuất "${deletingOrder?.orderCode}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteOrder.isPending}
      />
    </div>
  );
}
