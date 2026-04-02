"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useInventory, useWarehouses } from "@/hooks/api";
import { ApiResponse, CardStat, Inventory, Warehouse, WarehouseType } from "@/types";
import { useDebounce } from "@/hooks";
import Pagination from "@/components/tables/Pagination";
import { AlertTriangle, Download, RotateCcw, Package, DollarSign, TrendingDown, Search, Lock, Calendar, FileText, PencilLine, Repeat2, X } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { handleExportInventory } from "@/lib/excel";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { StockCardModal } from "@/components/inventory/StockCardModal";
import { QuickAdjustModal } from "@/components/inventory/QuickAdjustModal";
import { StockTransferModal } from "@/components/inventory/StockTransferModal";

export default function InventoryPage() {
  const router = useRouter();
  
  // Stock Card Modal
  const [isStockCardOpen, setIsStockCardOpen] = useState(false);
  const [selectedStockCard, setSelectedStockCard] = useState<{
    warehouseId: number;
    productId: number;
    productName: string;
    warehouseName: string;
  } | null>(null);

  // Quick Adjust Modal
  const [isQuickAdjustOpen, setIsQuickAdjustOpen] = useState(false);
  const [selectedQuickAdjust, setSelectedQuickAdjust] = useState<{
    warehouseId: number;
    productId: number;
    productName: string;
    warehouseName: string;
    currentQuantity: number;
  } | null>(null);

  // Stock Transfer Modal
  const [isStockTransferOpen, setIsStockTransferOpen] = useState(false);
  const [selectedStockTransfer, setSelectedStockTransfer] = useState<{
    fromWarehouseId: number;
    fromWarehouseName: string;
    productId: number;
    productName: string;
    currentQuantity: number;
  } | null>(null);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [warehouseFilter, setWarehouseFilter] = useState<number | "all">("all");
  const [warehouseTypeFilter, setWarehouseTypeFilter] = useState<WarehouseType | "all">("all");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [outOfStockFilter, setOutOfStockFilter] = useState(false);

  // Fetch dữ liệu cho bộ lọc
  const { data: warehousesResponse } = useWarehouses();
  const warehouses = warehousesResponse?.data as unknown as Warehouse[] || [];

  // Fetch tồn kho
  const { data, isLoading, error, refetch } = useInventory({
    page,
    limit,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(warehouseFilter !== 'all' && { warehouseId: warehouseFilter }),
    ...(warehouseTypeFilter !== 'all' && { warehouseType: warehouseTypeFilter }),
    ...(lowStockFilter && { lowStock: true }),
    ...(outOfStockFilter && { outOfStock: true }),
  });
  const responseWrapper = data as unknown as ApiResponse<Inventory[]> & { cards: CardStat };

  const response = responseWrapper?.data || [];
  const paginationMeta = responseWrapper?.meta;
  const cards = responseWrapper?.cards || [];

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, warehouseFilter, warehouseTypeFilter, lowStockFilter, outOfStockFilter]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  }

  // Hàm làm mới dữ liệu
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("Làm mới dữ liệu thành công!");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Hàm xuất Excel
  const handleExportExcel = () => {
    handleExportInventory(response);
  };

  // Hàm tính status tồn kho
  const getInventoryStatus = (availableQty: number, minStock: number) => {
    if (availableQty === 0) {
      return { color: 'red' as const, text: 'Hết hàng' };
    } else if (availableQty < minStock) {
      return { color: 'yellow' as const, text: 'Sắp hết' };
    }
    return { color: 'green' as const, text: 'Sẵn sàng' };
  };

  // Kiểm tra có bộ lọc nào đang hoạt động
  const hasActiveFilters = searchTerm || warehouseFilter !== "all" || warehouseTypeFilter !== "all" || lowStockFilter || outOfStockFilter;

  // Xóa tất cả bộ lọc
  const handleResetFilters = () => {
    setSearchTerm("");
    setWarehouseFilter("all");
    setWarehouseTypeFilter("all");
    setLowStockFilter(false);
    setOutOfStockFilter(false);
    setPage(1);
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
        <p className="text-red-800 dark:text-red-200">
          Lỗi khi tải dữ liệu tồn kho: {(error as any)?.message || "Unknown error"}
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
            Quản lý Tồn kho
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Theo dõi tồn kho theo thời gian thực
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleExportExcel}
            variant="outline"
            size="ssmm"
          >
            <Download className="h-5 w-5" />
            Xuất Excel
          </Button>

          <Button
            onClick={() => router.push("/inventory/alerts")}
            size="ssmm"
            variant="outlineWarning"
          >
            <AlertTriangle className="h-5 w-5" />
            Cảnh báo tồn thấp
            {cards.lowStockItems > 0 && (
              <span className="ml-1 rounded-full bg-orange-600 px-2 py-0.5 text-xs font-bold text-white">
                {cards.lowStockItems}
              </span>
            )}
          </Button>

          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="primary"
            size="ssmm"
          >
            <RotateCcw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
            Làm mới dữ liệu
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Value Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-green-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-green-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -z-0" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Giá trị tồn kho
              </p>
              <p className="mt-3 text-3xl font-bold text-green-600 dark:text-green-400 transition-all duration-300 group-hover:scale-110">
                {formatCurrency(cards.totalValue)}
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative border-2 border-green-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <DollarSign className="h-7 w-7 text-green-600 dark:text-green-400" strokeWidth={2} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-900">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Tổng giá trị sản phẩm trong kho
            </p>
          </div>
        </div>

        {/* Low Stock Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-orange-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-orange-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -z-0" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tồn kho thấp & hết hạn
              </p>
              <p className="mt-3 text-3xl font-bold text-orange-600 dark:text-orange-400 transition-all duration-300 group-hover:scale-110">
                {cards.lowStockItems}
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative border-2 border-orange-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <TrendingDown className="h-7 w-7 text-orange-600 dark:text-orange-400" strokeWidth={2} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-900">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Sản phẩm cảnh báo tồn thấp và hết hạn
            </p>
          </div>
        </div>

        {/* Reserved Items Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-blue-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-blue-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-0" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Hàng đang giữ
              </p>
              <p className="mt-3 text-3xl font-bold text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover:scale-110">
                {cards.reservedQuantity}
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative border-2 border-blue-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Lock className="h-7 w-7 text-blue-600 dark:text-blue-400" strokeWidth={2} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-900">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Số lượng chờ xuất
            </p>
          </div>
        </div>

        {/* Expiring Items Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-red-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-red-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -z-0" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Hàng hết hạn
              </p>
              <p className="mt-3 text-3xl font-bold text-red-600 dark:text-red-400 transition-all duration-300 group-hover:scale-110">
                {cards.expiredQuantity}
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative border-2 border-red-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Calendar className="h-7 w-7 text-red-600 dark:text-red-400" strokeWidth={2} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-900">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              SKU hết hạn
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          {/* Search */}
          <div>
            <label
                  htmlFor="limit"
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
                placeholder="Tìm theo tên hoặc mã..."
              />
            </div>
          </div>

          {/* Warehouse Filter */}
          <div>
            <label
              htmlFor="warehouse"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Kho
            </label>
            <SearchableSelect
              options={[
                { value: "all", label: "Tất cả kho" },
                ...warehouses.map((w) => ({
                  value: String(w.id),
                  label: `${w.warehouseName} (${w.warehouseCode})`,
                })),
              ]}
              value={warehouseFilter === "all" ? "all" : String(warehouseFilter)}
              onChange={(value) => {
                setWarehouseFilter(value === "all" ? "all" : Number(value));
              }}
              placeholder="Tìm kiếm kho..."
              isClearable={false}
            />
          </div>

          {/* Warehouse Type Filter */}
          <div>
              <label
                  htmlFor="limit"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                  Loại kho
              </label>
            <select
              value={warehouseTypeFilter}
              onChange={(e) => setWarehouseTypeFilter(e.target.value as any)}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả loại kho</option>
              <option value="raw_material">Nguyên liệu</option>
              <option value="packaging">Bao bì</option>
              <option value="finished_product">Thành phẩm</option>
              <option value="goods">Hàng hóa</option>
            </select>
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
                      setPage(1); // Reset to first page when changing limit
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
              <option value={100}>100 / trang</option>
              </select>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => {
                  setLowStockFilter(e.target.checked)
                  if(outOfStockFilter) {
                      setOutOfStockFilter(!outOfStockFilter)
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Tồn thấp
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={outOfStockFilter}
                onChange={(e) => {
                  setOutOfStockFilter(e.target.checked)
                  if(lowStockFilter) {
                      setLowStockFilter(!lowStockFilter)
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Hết hàng
              </span>
            </label>
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

            {warehouseTypeFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                Loại kho: {warehouseTypeFilter === "raw_material" ? "Nguyên liệu" : warehouseTypeFilter === "packaging" ? "Bao bì" : warehouseTypeFilter === "finished_product" ? "Thành phẩm" : "Hàng hóa"}
                <button
                  onClick={() => setWarehouseTypeFilter("all")}
                  className="hover:text-orange-900 dark:hover:text-orange-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {lowStockFilter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                Tồn thấp
                <button
                  onClick={() => setLowStockFilter(false)}
                  className="hover:text-yellow-900 dark:hover:text-yellow-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {outOfStockFilter && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                Hết hàng
                <button
                  onClick={() => setOutOfStockFilter(false)}
                  className="hover:text-red-900 dark:hover:text-red-300"
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
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : response.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <Package className="mb-4 h-12 w-12" />
            <p className="text-sm">Không tìm thấy tồn kho nào</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="border-b-1 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <TableRow>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Đơn vị
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Giá vốn
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Tồn thực tế
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Đang giữ
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Khả dụng
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Thao tác
                </th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {response.map((item) => {
                const minStock = Number(item.product?.minStockLevel || 0);
                const status = getInventoryStatus(item.availableQuantity, minStock);

                return (
                  <TableRow key={`${item.id}`}>
                    {/* Product */}
                    <TableCell className="whitespace-nowrap px-6 py-4 text-sm">
                      <Link
                        href={`/products/${item.product?.id}`}
                        className="flex items-center gap-3 hover:opacity-80 transition"
                      >
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                            {item.product?.productName || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {item.product?.sku || "N/A"}
                          </p>
                        </div>
                      </Link>
                    </TableCell>

                    {/* Warehouse */}
                    <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      <Link
                        href={`/warehouses/${item.warehouse?.id}`}
                        className="font-medium hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {item.warehouse?.warehouseName || "N/A"}
                      </Link>
                    </TableCell>

                    {/* Unit */}
                    <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {item.product?.unit || "—"}
                    </TableCell>

                    {/* Purchase Price */}
                    <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {item.product?.purchasePrice ? formatCurrency(Number(item.product.purchasePrice)) : "—"}
                    </TableCell>

                    {/* Quantity */}
                    <TableCell className="whitespace-nowrap px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                      {Number(item.quantity || 0).toLocaleString()}
                    </TableCell>

                    {/* Reserved Quantity */}
                    <TableCell className="whitespace-nowrap px-6 py-4 text-center">
                      <p className={`text-sm font-medium ${Number(item.reservedQuantity || 0) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>
                        {Number(item.reservedQuantity || 0).toLocaleString()}
                      </p>
                    </TableCell>

                    {/* Available Quantity */}
                    <TableCell className="whitespace-nowrap px-6 py-4 text-center text-sm font-bold text-gray-900 dark:text-white">
                      {item.availableQuantity.toLocaleString()}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="px-6 py-4 text-center">
                      <Badge color={status.color}>
                        {status.text}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          title="Xem thẻ kho"
                          onClick={() => {
                            setSelectedStockCard({
                              warehouseId: item.warehouse?.id!,
                              productId: item.product?.id!,
                              productName: item.product?.productName!,
                              warehouseName: item.warehouse?.warehouseName!,
                            });
                            setIsStockCardOpen(true);
                          }}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          title="Điều chỉnh"
                          onClick={() => {
                            setSelectedQuickAdjust({
                              warehouseId: item.warehouse?.id!,
                              productId: item.product?.id!,
                              productName: item.product?.productName!,
                              warehouseName: item.warehouse?.warehouseName!,
                              currentQuantity: Number(item.quantity),
                            });
                            setIsQuickAdjustOpen(true);
                          }}
                          className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <PencilLine className="h-4 w-4" />
                        </button>
                        <button
                          title="Chuyển kho"
                          onClick={() => {
                            setSelectedStockTransfer({
                              fromWarehouseId: item.warehouse?.id!,
                              fromWarehouseName: item.warehouse?.warehouseName!,
                              productId: item.product?.id!,
                              productName: item.product?.productName!,
                              currentQuantity: Number(item.quantity),
                            });
                            setIsStockTransferOpen(true);
                          }}
                          className="rounded p-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        >
                          <Repeat2 className="h-4 w-4" />
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
              <span className="font-medium">{paginationMeta.total}</span> sản phẩm tồn
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

        {/* Stock Card Modal */}
        {selectedStockCard && (
          <StockCardModal
            isOpen={isStockCardOpen}
            onClose={() => {
              setIsStockCardOpen(false);
              setSelectedStockCard(null);
            }}
            warehouseId={selectedStockCard.warehouseId}
            productId={selectedStockCard.productId}
            productName={selectedStockCard.productName}
            warehouseName={selectedStockCard.warehouseName}
          />
        )}

        {/* Quick Adjust Modal */}
        {selectedQuickAdjust && (
          <QuickAdjustModal
            isOpen={isQuickAdjustOpen}
            onClose={() => {
              setIsQuickAdjustOpen(false);
              setSelectedQuickAdjust(null);
              refetch();
            }}
            warehouseId={selectedQuickAdjust.warehouseId}
            productId={selectedQuickAdjust.productId}
            productName={selectedQuickAdjust.productName}
            warehouseName={selectedQuickAdjust.warehouseName}
            currentQuantity={selectedQuickAdjust.currentQuantity}
          />
        )}

        {/* Stock Transfer Modal */}
        {selectedStockTransfer && (
          <StockTransferModal
            isOpen={isStockTransferOpen}
            onClose={() => {
              setIsStockTransferOpen(false);
              setSelectedStockTransfer(null);
              refetch();
            }}
            fromWarehouseId={selectedStockTransfer.fromWarehouseId}
            fromWarehouseName={selectedStockTransfer.fromWarehouseName}
            productId={selectedStockTransfer.productId}
            productName={selectedStockTransfer.productName}
            currentQuantity={selectedStockTransfer.currentQuantity}
          />
        )}
    </div>
  );
}
