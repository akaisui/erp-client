"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSuppliers, useDeleteSupplier } from "@/hooks/api";
import { Can } from "@/components/auth";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/tables/Pagination";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import ImportPreviewModal from "@/components/ui/modal/ImportPreviewModal";
import { ApiResponse, StatusCommon, Supplier, SupplierCards, SupplierType } from "@/types";
import { Plus, Trash2, Eye, Phone, Mail, Users, CheckCircle, DollarSign, Search, Box, X, RotateCcw, Edit, Download, Upload, MoreVertical, History, FileText } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency } from "@/lib/utils";
import { handleExportSuppliers, handleImportSuppliers } from "@/lib/excel";

export default function SuppliersPage() {
  const router = useRouter();

  // Pagination & Filter state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState<StatusCommon | "all">("all");
  const [typeFilter, setTypeFilter] = useState<SupplierType | "all">("all");

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  // Import dialog state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importResult, setImportResult] = useState<{
    data: any[];
    errors: Array<{ row: number; supplierName: string; message: string }>;
    duplicates: Array<{ row: number; supplierCode: string }>;
  } | null>(null);

  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Fetch suppliers với filter
  const { data: response, isLoading, error } = useSuppliers({
    page,
    limit,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(typeFilter !== "all" && { supplierType: typeFilter }),
  });
  const responseData = response as unknown as ApiResponse<Supplier[]> & { cards: SupplierCards };
  console.log('NCC', responseData);

  // Reset page khi filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, typeFilter]);

  const deleteSupplier = useDeleteSupplier();

  // Data từ response
  const suppliers = responseData?.data || [];
  const paginationMeta = responseData?.meta;
  const cards = responseData?.cards;

  // Kiểm tra có bộ lọc nào đang hoạt động
  const hasActiveFilters = searchTerm || typeFilter !== "all" || statusFilter !== "all";

  // Xóa tất cả bộ lọc
  const handleResetFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const openDeleteDialog = (supplier: Supplier) => {
    setDeletingSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingSupplier(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSupplier) return;

    try {
      await deleteSupplier.mutateAsync(deletingSupplier.id);
      closeDeleteDialog();
    } finally {
      closeDeleteDialog();
    }
  };

  // Handle import Excel
  const handleImportExcelFile = async (file: File) => {
    try {
      const result = await handleImportSuppliers(file);
      
      // Set result and open modal for preview
      setImportResult(result);
      setIsImportModalOpen(true);

    } catch (error) {
      // Show error in modal
      setImportResult({
        data: [],
        errors: [{ row: 1, supplierName: "N/A", message: (error as Error).message }],
        duplicates: [],
      });
      setIsImportModalOpen(true);
    }
  };

  const handleImportConfirm = () => {
    if (!importResult || importResult.data.length === 0) {
      setIsImportModalOpen(false);
      setImportResult(null);
      return;
    }

    // TODO: Call API to bulk import suppliers
    console.log("✅ Confirming import of suppliers:", importResult.data);
    
    // Show success and close modal
    setIsImportModalOpen(false);
    setImportResult(null);
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
        <p className="text-red-800 dark:text-red-200">
          Lỗi khi tải danh sách nhà cung cấp: {(error as any)?.message || "Unknown error"}
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
            Quản lý Nhà cung cấp
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý thông tin nhà cung cấp nguyên liệu, bao bì, hàng hóa
          </p>
        </div>

        <Can permission="create_supplier">
          <div className="flex gap-2">
            <Button
              onClick={() => handleExportSuppliers(suppliers)}
              variant="outline"
              size="ssmm"
              title="Xuất danh sách NCC ra Excel"
            >
              <Download className="mr-2 h-5 w-5" />
              Xuất Excel
            </Button>

            <div className="relative">
              <input
                type="file"
                id="import-excel"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImportExcelFile(file);
                  }
                  e.target.value = '';
                }}
              />
              <label htmlFor="import-excel">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    const fileInput = document.getElementById("import-excel") as HTMLInputElement;
                    fileInput?.click();
                  }}
                  size="ssmm"
                  title="Nhập danh sách NCC từ Excel"
                  variant="outline"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Nhập Excel
                </Button>
              </label>
            </div>

            <Button
              onClick={() => router.push("/suppliers/create")}
              variant="primary"
              size="ssmm"
              title="Tạo nhà cung cấp mới"
            >
              <Plus className="mr-2 h-5 w-5" />
              Thêm NCC mới
            </Button>
          </div>
        </Can>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Suppliers Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-blue-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-blue-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-0" />
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          ) : (
            <>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tổng số NCC
                  </p>
                  <p className="mt-3 text-3xl font-bold text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover:scale-110">
                    {cards.totalSuppliers}
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                  <div className="relative border-2 border-blue-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <Users className="h-7 w-7 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-900">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Tổng số nhà cung cấp trong hệ thống
                </p>
              </div>
            </>
          )}
        </div>

        {/* Active Suppliers Card */}
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
                    {cards.activeSuppliers}
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
                  NCC sẵn sàng hoạt động
                </p>
              </div>
            </>
          )}
        </div>

        {/* Total Debt Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-red-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-red-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -z-0" />
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          ) : (
            <>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tổng nợ phải trả
                  </p>
                  <p className="mt-3 text-3xl font-bold text-red-600 dark:text-red-400 transition-all duration-300 group-hover:scale-110">
                    {formatCurrency(cards.totalDebt || 0)}
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                  <div className="relative border-2 border-red-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <DollarSign className="h-7 w-7 text-red-600 dark:text-red-400" strokeWidth={2} />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-900">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Cần thanh toán cho NCC
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
                placeholder="Tên, mã, số điện thoại..."
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label
              htmlFor="type"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Loại NCC
            </label>
            <select
              id="type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả loại</option>
              <option value="local">Trong nước</option>
              <option value="foreign">Nước ngoài</option>
            </select>
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
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
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
                setPage(1);
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
                Loại: {typeFilter === "local" ? "Trong nước" : "Nước ngoài"}
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
                Trạng thái: {statusFilter === "active" ? "Hoạt động" : "Không hoạt động"}
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
        ) : suppliers.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <Box className="mb-4 h-12 w-12" />
            <p className="text-sm">Không tìm thấy nhà cung cấp nào</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="border-b-1 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <TableRow>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Mã NCC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Tên NCC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Nợ phải trả
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
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {supplier.supplierCode || "—"}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Link
                      href={`/suppliers/${supplier.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                    >
                      {supplier.supplierName}
                    </Link>
                    {supplier.contactName && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {supplier.contactName}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm">
                    <Badge color={supplier.supplierType === "local" ? "blue" : "purple"}>
                      {supplier.supplierType === "local" ? "Trong nước" : "Nước ngoài"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <div className="space-y-1">
                      {supplier.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          <span>{supplier.email}</span>
                        </div>
                      )}
                      {!supplier.phone && !supplier.email && <span className="text-gray-400">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency((supplier as any).totalPayable || 0)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm">
                    <Badge color={supplier.status === "active" ? "green" : "gray"}>
                      {supplier.status === "active" ? "Hoạt động" : "Không hoạt động"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right text-sm font-medium">
                    <div className="relative flex items-center justify-end gap-1">
                      {/* Quick View Link */}
                      <Link
                        href={`/suppliers/${supplier.id}`}
                        className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>

                      {/* Dropdown Menu */}
                      <div className="relative">
                        <Button
                          onClick={() =>
                            setOpenDropdownId(
                              openDropdownId === supplier.id ? null : supplier.id
                            )
                          }
                          variant="normal"
                          size="normal"
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                          title="Thêm thao tác"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>

                        <Dropdown
                          isOpen={openDropdownId === supplier.id}
                          onClose={() => setOpenDropdownId(null)}
                          className="w-56"
                        >
                          {/* Chỉnh sửa */}
                          <Can permission="update_supplier">
                            <DropdownItem
                              tag="a"
                              href={`/suppliers/${supplier.id}/edit`}
                              onItemClick={() => setOpenDropdownId(null)}
                              className="text-blue-600! hover:bg-blue-50! dark:text-blue-400! dark:hover:bg-blue-900/20!"
                            >
                              <div className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                <span>Chỉnh sửa</span>
                              </div>
                            </DropdownItem>
                          </Can>

                          {/* Lịch sử nhập hàng */}
                          <DropdownItem
                            tag="a"
                            href={`/purchase-orders?supplierId=${supplier.id}`}
                            onItemClick={() => setOpenDropdownId(null)}
                            className="text-purple-600! hover:bg-purple-50! dark:text-purple-400! dark:hover:bg-purple-900/20!"
                          >
                            <div className="flex items-center gap-2">
                              <History className="h-4 w-4" />
                              <span>Lịch sử nhập hàng</span>
                            </div>
                          </DropdownItem>

                          {/* Tạo phiếu chi */}
                          <Can permission="create_payment_voucher">
                            <DropdownItem
                              tag="a"
                              href={`/payment-vouchers/create?supplier_id=${supplier.id}`}
                              onItemClick={() => setOpenDropdownId(null)}
                              className="text-green-600! hover:bg-green-50! dark:text-green-400! dark:hover:bg-green-900/20!"
                            >
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                <span>Tạo phiếu chi</span>
                              </div>
                            </DropdownItem>
                          </Can>

                          {/* Xóa */}
                          <Can permission="delete_supplier">
                            <DropdownItem
                              onClick={() => openDeleteDialog(supplier)}
                              className="text-red-600! hover:bg-red-50! dark:text-red-400! dark:hover:bg-red-900/20!"
                            >
                              <div className="flex items-center gap-2">
                                <Trash2 className="h-4 w-4" />
                                <span>Xóa</span>
                              </div>
                            </DropdownItem>
                          </Can>
                        </Dropdown>
                      </div>
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
            <span className="font-medium">{paginationMeta.total}</span> nhà cung cấp
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
        title="Xóa nhà cung cấp"
        message={`Bạn có chắc chắn muốn xóa nhà cung cấp "${deletingSupplier?.supplierName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteSupplier.isPending}
      />

      {/* Import Preview Modal */}
      <ImportPreviewModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportResult(null);
        }}
        onConfirm={handleImportConfirm}
        validCount={importResult?.data.length || 0}
        errorCount={importResult?.errors.length || 0}
        duplicateCount={importResult?.duplicates.length || 0}
        errors={importResult?.errors.map(e => ({
          row: e.row,
          sku: e.supplierName,
          message: e.message
        })) || []}
        duplicates={importResult?.duplicates.map(d => ({
          row: d.row,
          sku: d.supplierCode
        })) || []}
        itemName="nhà cung cấp"
        itemLabel="Mã NCC"
      />
    </div>
  );
}
