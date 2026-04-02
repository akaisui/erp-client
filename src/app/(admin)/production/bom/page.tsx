"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useBOMs, useDeleteBOM, useApproveBOM, useSetBOMInactive, useProducts } from "@/hooks/api";
import { Can } from "@/components/auth";
import Button from "@/components/ui/button/Button";
import { ApiResponse, Bom, BomStatus, Product } from "@/types";
import { Plus, CheckCircle, Package, Edit, Eye, Trash2, Search, MoreVertical } from "lucide-react";
import { BOM_STATUS_LABELS } from "@/lib/constants";
import { format } from "date-fns";
import { useDebounce } from "@/hooks";
import Pagination from "@/components/tables/Pagination";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import { useRouter } from "next/navigation";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";

export default function BOMListPage() {
  const router = useRouter();

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState<BomStatus | "all">("all");
  const [productFilter, setProductFilter] = useState<number | "all">("all");

  // Dialog delete
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingBom, setDeletingBom] = useState<Bom | null>(null);
  
  // Dialog approve
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [approvingBom, setApprovingBom] = useState<Bom | null>(null);
  
  // Dropdown menu state
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  
  const deleteBOM = useDeleteBOM();
  const approveBOM = useApproveBOM();
  const setInactive = useSetBOMInactive();

  // Fetch BOMs
  const { data, isLoading, error } = useBOMs({
    page,
    limit,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(productFilter !== "all" && { finishedProductId: productFilter }),
  });
  const response = data as unknown as ApiResponse<Bom[]>;
  const boms = response?.data || [];
  const paginationMeta = response?.meta;

  const { data: productsResponse, isLoading: productLoading } = useProducts({
    productType: 'finished_product',
    limit: 1000,
  }); 
  const products = productsResponse?.data as unknown as Product[] || [];

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleDeleteClick = (bom: Bom) => {
    setDeletingBom(bom);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingBom(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBom) return;
    await deleteBOM.mutateAsync(deletingBom.id);
    setIsDeleteDialogOpen(false);
    setDeletingBom(null);
  };

  const handleApprove = (id: number, bomCode: string) => {
    const bom = boms.find(b => b.id === id);
    if (bom) {
      setApprovingBom(bom);
      setIsApproveDialogOpen(true);
    }
  };

  const handleConfirmApprove = async () => {
    if (!approvingBom) return;
    await approveBOM.mutateAsync({ id: approvingBom.id });
    setIsApproveDialogOpen(false);
    setApprovingBom(null);
  };

  const handleSetInactive = async (id: number, bomCode: string) => {
    const reason = window.prompt(`Lý do ngừng sử dụng BOM "${bomCode}":`);
    if (reason !== null) {
      setInactive.mutate({ id, reason });
    }
  };

  // Get status badge color
  const getStatusBadgeClass = (status: BomStatus) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
        <p className="text-red-800 dark:text-red-200">
          Lỗi khi tải danh sách BOM: {(error as any)?.message || "Unknown error"}
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
            Công Thức Sản Xuất (BOM)
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý công thức nguyên liệu cho sản phẩm thành phẩm
          </p>
        </div>

        <Can permission="create_bom">
          <Button variant="primary" size="smm" onClick={() => router.push('/production/bom/create')}>
            <Plus className="mr-2 h-5 w-5" />
            Tạo BOM Mới
          </Button>
        </Can>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Tổng số BOM */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-blue-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer dark:border-gray-800 dark:from-gray-900 dark:to-blue-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-0" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tổng số BOM
              </p>
              <p className="mt-3 text-3xl font-bold text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover:scale-110">
                {boms.length}
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
              Công thức sản xuất
            </p>
          </div>
        </div>

        {/* Card 2: Đang sử dụng (Active) */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-green-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer dark:border-gray-800 dark:from-gray-900 dark:to-green-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -z-0" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Đang sử dụng
              </p>
              <p className="mt-3 text-3xl font-bold text-green-600 dark:text-green-400 transition-all duration-300 group-hover:scale-110">
                {boms.filter((b) => b.status === "active").length}
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
              Sẵn sàng sử dụng
            </p>
          </div>
        </div>

        {/* Card 3: Nháp (Draft) */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-amber-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer dark:border-gray-800 dark:from-gray-900 dark:to-amber-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -z-0" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Nháp
              </p>
              <p className="mt-3 text-3xl font-bold text-amber-600 dark:text-amber-400 transition-all duration-300 group-hover:scale-110">
                {boms.filter((b) => b.status === "draft").length}
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative border-2 border-amber-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Edit className="h-7 w-7 text-amber-600 dark:text-amber-400" strokeWidth={2} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-900">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Chờ phê duyệt
            </p>
          </div>
        </div>

        {/* Card 4: Không sử dụng (Inactive) */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer dark:border-gray-800 dark:from-gray-900 dark:to-slate-950">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/10 rounded-full blur-3xl -z-0" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Không sử dụng
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-600 dark:text-slate-400 transition-all duration-300 group-hover:scale-110">
                {boms.filter((b) => b.status === "inactive").length}
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-slate-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative border-2 border-slate-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Package className="h-7 w-7 text-slate-600 dark:text-slate-400" strokeWidth={2} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-900">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Ngừng sử dụng
            </p>
          </div>
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
                placeholder="Tìm theo mã BOM, tên sản phẩm..."
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
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="draft">Nháp</option>
              <option value="active">Đang sử dụng</option>
              <option value="inactive">Không sử dụng</option>
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label
              htmlFor="limit"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Sản phẩm
            </label>
            <SearchableSelect
                options={[
                    { value: "all", label: "Tất cả sản phẩm" },
                    ...products.map((p) => ({
                    value: p.id,
                    label: `${p.sku} - ${p.productName}`,
                    })),
                ]}
                value={productFilter}
                onChange={(value) => setProductFilter(value as number | "all")}
                placeholder="Tìm kiếm sản phẩm..."
                isLoading={productLoading}
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
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : boms.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <svg
              className="mb-4 h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p>Không tìm thấy BOM nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Mã BOM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Phiên bản
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Sản lượng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Hiệu suất
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {boms.map((bom) => (
                  <tr key={bom.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-start gap-2">
                        <Link
                          href={`/production/bom/${bom.id}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          {bom.bomCode}
                        </Link>
                        {bom.status === "draft" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 whitespace-nowrap">
                            ⏳ Chờ duyệt
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                            <Link
                                href={`/products/${bom.finishedProduct?.id}`}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                >
                            {bom.finishedProduct?.productName}
                            </Link>
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {bom.finishedProduct?.sku}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {bom.version}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {bom.outputQuantity} {bom.finishedProduct?.unit}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {bom.efficiencyRate}%
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
                          bom.status
                        )}`}
                      >
                        {BOM_STATUS_LABELS[bom.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(bom.createdAt), "dd/MM/yyyy")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Button */}
                        <Link
                          href={`/production/bom/${bom.id}`}
                          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </Link>

                        {/* Dropdown Menu */}
                        <div className="relative z-50">
                          <button
                            className="dropdown-toggle rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setOpenDropdown(openDropdown === bom.id ? null : bom.id)}
                            title="Thêm hành động"
                          >
                            <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          </button>

                          <Dropdown
                            isOpen={openDropdown === bom.id}
                            onClose={() => setOpenDropdown(null)}
                            className="w-48"
                          >
                            {/* Edit - Draft only */}
                            {bom.status === "draft" && (
                              <Can permission="update_bom">
                                <DropdownItem
                                  tag="a"
                                  href={`/production/bom/${bom.id}/edit`}
                                  onItemClick={() => setOpenDropdown(null)}
                                  className="dark:hover:bg-gray-700 dark:text-gray-300"
                                >
                                  <div className="flex items-center gap-2">
                                    <Edit className="h-4 w-4" />
                                    <span>Chỉnh sửa</span>
                                  </div>
                                </DropdownItem>
                              </Can>
                            )}

                            {/* Approve - Draft only */}
                            {bom.status === "draft" && (
                              <Can permission="approve_bom">
                                <DropdownItem
                                  onClick={() => {
                                    handleApprove(bom.id, bom.bomCode);
                                    setOpenDropdown(null);
                                  }}
                                  className="dark:hover:bg-gray-700 dark:text-gray-300"
                                >
                                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <span>Phê duyệt</span>
                                  </div>
                                </DropdownItem>
                              </Can>
                            )}

                            {/* Set Inactive - Active only */}
                            {bom.status === "active" && (
                              <Can permission="update_bom">
                                <DropdownItem
                                  onClick={() => {
                                    handleSetInactive(bom.id, bom.bomCode);
                                    setOpenDropdown(null);
                                  }}
                                  className="dark:hover:bg-gray-700 dark:text-gray-300"
                                >
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    <span>Ngừng dùng</span>
                                  </div>
                                </DropdownItem>
                              </Can>
                            )}

                            {/* Delete - Draft only */}
                            {(bom.status === "draft" || bom.status === "inactive") && (
                              <Can permission="delete_bom">
                                <div className="border-t border-gray-200 dark:border-gray-700">
                                  <DropdownItem
                                    onClick={() => {
                                      handleDeleteClick(bom);
                                      setOpenDropdown(null);
                                    }}
                                    className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Trash2 className="h-4 w-4" />
                                      <span>Xóa</span>
                                    </div>
                                  </DropdownItem>
                                </div>
                              </Can>
                            )}
                          </Dropdown>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
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
            <span className="font-medium">{paginationMeta.total}</span> công thức
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
        title="Xóa BOM"
        message={`Bạn có chắc chắn muốn xóa BOM "${deletingBom?.bomCode}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteBOM.isPending}
      />

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isApproveDialogOpen}
        onClose={() => {
          setIsApproveDialogOpen(false);
          setApprovingBom(null);
        }}
        onConfirm={handleConfirmApprove}
        title="Phê duyệt BOM"
        message={`Bạn có chắc chắn muốn phê duyệt BOM "${approvingBom?.bomCode}"? Sau khi phê duyệt, BOM sẽ được sử dụng để tạo lệnh sản xuất.`}
        confirmText="Phê duyệt"
        cancelText="Hủy"
        variant="info"
        isLoading={approveBOM.isPending}
      />
    </div>
  );
}
