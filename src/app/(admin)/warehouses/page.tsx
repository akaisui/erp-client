"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWarehouses, useDeleteWarehouse } from "@/hooks/api";
import { Can } from "@/components/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import Badge, { type BadgeColor } from "@/components/ui/badge/Badge";
import { WarehouseType, StatusCommon, ApiResponse, Warehouse, WarehouseCards } from "@/types";
import { Calendar, CheckCircle, Edit, Eye, Package, Plus, Trash2, TrendingUp, Search, Box, X, RotateCcw } from "lucide-react";
import { useDebounce } from "@/hooks";
import Pagination from "@/components/tables/Pagination";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import Button from "@/components/ui/button/Button";
import { useRouter } from 'next/navigation';
import { formatCurrency } from "@/lib/utils";

export default function WarehousesPage() {
  const router = useRouter();

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [typeFilter, setTypeFilter] = useState<WarehouseType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | StatusCommon>("all");

  // Dialog delete
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingWarehouse, setDeletingWarehouse] = useState<Warehouse | null>(null);
  const deleteWarehouse = useDeleteWarehouse();

  // Fetch warehouses với server-side pagination
  const { data, isLoading, error } = useWarehouses({
    page,
    limit,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(typeFilter !== "all" && { warehouseType: typeFilter }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
  });
  const response = data as unknown as ApiResponse<Warehouse[]> & { cards: WarehouseCards };

  const warehouses = response?.data || [];
  const paginationMeta = response?.meta;
  const warehouseCards = response?.cards || null;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, statusFilter]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  }

  const handleDeleteClick = (warehouse: Warehouse) => {
    setDeletingWarehouse(warehouse);
    setIsDeleteDialogOpen(true);
  }

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingWarehouse(null);
  }

  const handleConfirmDelete = async () => {
    if(!deletingWarehouse) return;
    try {
      await deleteWarehouse.mutateAsync(deletingWarehouse.id);
    } catch (error) {}
    finally {
      setIsDeleteDialogOpen(false);
      setDeletingWarehouse(null);
    }
  }

  // Kiểm tra có bộ lọc nào đang hoạt động
  const hasActiveFilters = searchTerm || typeFilter !== "all" || statusFilter !== "all";

  // Xóa tất cả bộ lọc
  const handleResetFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  // Warehouse type labels
  const getTypeLabel = (type: WarehouseType) => {
    const labels: Record<WarehouseType, string> = {
      raw_material: "Nguyên liệu",
      packaging: "Bao bì",
      finished_product: "Thành phẩm",
      goods: "Hàng hóa",
    };
    return labels[type];
  };

  // Warehouse type badge colors
  const getTypeBadgeColor = (type: WarehouseType): BadgeColor => {
    const colors: Record<WarehouseType, BadgeColor> = {
      raw_material: "blue",
      packaging: "yellow",
      finished_product: "green",
      goods: "purple",
    };
    return colors[type];
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
        <p className="text-red-800 dark:text-red-200">
          Lỗi khi tải danh sách kho: {(error as any)?.message || "Unknown error"}
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
            Quản lý Kho
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý thông tin các kho hàng trong hệ thống
          </p>
        </div>

        <Can permission="create_warehouse">
            <Button variant="primary" size="ssmm" onClick={() => router.push('/warehouses/create')}>
                <Plus className="mr-2 h-5 w-5" />
                Thêm kho mới
            </Button>
        </Can>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Warehouses Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-blue-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-blue-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-0" />
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          ) : (
            <>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tổng số kho
                  </p>
                  <p className="mt-3 text-3xl font-bold text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover:scale-110">
                    {warehouseCards?.totalWarehouses || 0}
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
                  Tổng số kho trong hệ thống
                </p>
              </div>
            </>
          )}
        </div>

        {/* Active Warehouses Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-green-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-green-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -z-0" />
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          ) : (
            <>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Đang hoạt động
                  </p>
                  <p className="mt-3 text-3xl font-bold text-green-600 dark:text-green-400 transition-all duration-300 group-hover:scale-110">
                    {warehouseCards?.activeWarehouses || 0}
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
                  Kho sẵn sàng hoạt động
                </p>
              </div>
            </>
          )}
        </div>

        {/* Created This Month Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-yellow-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-yellow-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -z-0" />
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          ) : (
            <>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tạo tháng này
                  </p>
                  <p className="mt-3 text-3xl font-bold text-yellow-600 dark:text-yellow-400 transition-all duration-300 group-hover:scale-110">
                    {warehouseCards?.createdThisMonth || 0}
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                  <div className="relative border-2 border-yellow-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <Calendar className="h-7 w-7 text-yellow-600 dark:text-yellow-400" strokeWidth={2} />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-yellow-200 dark:border-yellow-900">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Kho mới được tạo
                </p>
              </div>
            </>
          )}
        </div>

        {/* Total Inventory Value Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-purple-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-purple-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-0" />
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          ) : (
            <>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tổng tồn kho
                  </p>
                  <p className="mt-3 text-3xl font-bold text-purple-600 dark:text-purple-400 transition-all duration-300 group-hover:scale-110">
                    {formatCurrency(warehouseCards?.totalInventoryValue || 0)}
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
                  Giá trị sản phẩm trong kho
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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
                    placeholder="Tìm theo tên hoặc mã kho..."
                    />
                </div>
            </div>

            {/* Type Filter */}
            <div>
            <label
                htmlFor="limit"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                Loại kho
            </label>
            <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
                <option value="all">Tất cả loại kho</option>
                <option value="raw_material">Nguyên liệu</option>
                <option value="packaging">Bao bì</option>
                <option value="finished_product">Thành phẩm</option>
                <option value="goods">Hàng hóa</option>
            </select>
            </div>

            {/* Status Filter */}
            <div>
            <label
                htmlFor="limit"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                Trạng thái
            </label>
            <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngưng hoạt động</option>
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

            {typeFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                Loại kho: {getTypeLabel(typeFilter)}
                <button
                  onClick={() => setTypeFilter("all")}
                  className="hover:text-purple-900 dark:hover:text-purple-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                Trạng thái: {statusFilter === "active" ? "Hoạt động" : "Ngưng hoạt động"}
                <button
                  onClick={() => setStatusFilter("all")}
                  className="hover:text-yellow-900 dark:hover:text-yellow-300"
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
        ) : warehouses.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <Box className="mb-4 h-12 w-12" />
            <p className="text-sm">Không tìm thấy kho nào</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="border-b-1 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <TableRow>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Mã kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Tên kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Quản lý
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Địa chỉ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Thao tác
                </th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {warehouse.warehouseCode}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <Link
                      href={`/warehouses/${warehouse.id}`}
                      className="font-medium hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {warehouse.warehouseName}
                    </Link>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm">
                    <Badge color={getTypeBadgeColor(warehouse.warehouseType)}>
                      {getTypeLabel(warehouse.warehouseType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {warehouse.manager ? (
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {warehouse.manager.fullName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {warehouse.manager.employeeCode}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {warehouse.address ? (
                      <span>
                        {warehouse.address}
                        {warehouse.city && `, ${warehouse.city}`}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm">
                    <Badge color={warehouse.status === "active" ? "green" : "gray"}>
                      {warehouse.status === "active" ? "Hoạt động" : "Ngưng"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/warehouses/${warehouse.id}`}
                        className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        title="Xem"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>

                      <Can permission="update_warehouse">
                        <Link
                          href={`/warehouses/${warehouse.id}/edit`}
                          className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Can>

                      <Can permission="delete_warehouse">
                        <button
                          onClick={() => handleDeleteClick(warehouse)}
                          className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Xóa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </Can>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
              <span className="font-medium">{paginationMeta.total}</span> kho
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
      onClose={closeDeleteDialog}
      onConfirm={handleConfirmDelete}
      title="Xóa kho hàng"
      message={`Bạn có chắc chắn muốn xóa kho hàng "${deletingWarehouse?.warehouseName}"? Hành động này không thể hoàn tác.`}
      confirmText="Xóa"
      cancelText="Hủy"
      variant="danger"
      isLoading={deleteWarehouse.isPending}
      />
    </div>
  );
}
