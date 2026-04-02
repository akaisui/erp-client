"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  useProducts,
  useDeleteProduct,
  useCategories,
  useSuppliers,
  useRawMaterialStats,
  type RawMaterialStats,
} from "@/hooks/api";
import { Can } from "@/components/auth";
import { ProductTable } from "@/components/products";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/tables/Pagination";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import SearchableSelect, { SelectOption } from "@/components/ui/SearchableSelect";
import { ApiResponse, Category, Product, Supplier, type ProductStatus } from "@/types";
import { Download, Plus, AlertTriangle, Clock, XCircle, Package } from "lucide-react";
import { useDebounce } from "@/hooks";

export default function ProductsPage() {
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  
  const [statusFilter, setStatusFilter] = useState<
    "all" | ProductStatus
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");
  const [supplierFilter, setSupplierFilter] = useState<number | "all">("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Fetch raw material stats
  const { data: statsResponse, isLoading: statsLoading } = useRawMaterialStats();

  // Fetch nhiên liệu với phân trang
  const { data, isLoading, error } = useProducts({
    page,
    limit,
    productType: 'raw_material',
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(categoryFilter !== "all" && { categoryId: categoryFilter }),
    ...(supplierFilter !== "all" && { supplierId: supplierFilter }),
  });
  const response = data as unknown as ApiResponse<Product[]>;
  const { data: categoriesResponse } = useCategories({ 
    status: "active",
    limit: 1000,
  });
  const categoriesTemp = categoriesResponse as unknown as ApiResponse<Category[]>;
  const { data: suppliersResponse } = useSuppliers({ 
    status: "active",
    limit: 1000,
  });
  const suppliersTemp = suppliersResponse as unknown as ApiResponse<Supplier[]>;
  const deleteProduct = useDeleteProduct();

  const categories = categoriesTemp?.data || [];
  const suppliers = suppliersTemp?.data || [];

  const products = response?.data || [];
  const paginationMeta = response?.meta;
  const stats = statsResponse as unknown as RawMaterialStats | undefined;

  // Reset lại page 1 khi thay đổi filter hoặc search
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, categoryFilter, supplierFilter]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    await deleteProduct.mutateAsync(deletingProduct.id);
    setIsDeleteDialogOpen(false);
    setDeletingProduct(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingProduct(null);
  };

  // Xuất Excel
  const handleExportExcel = () => {
    if (products.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    // Prepare data for export
    const exportData = products.map((product) => ({
      SKU: product.sku,
      "Tên sản phẩm": product.productName,
      "Loại sản phẩm": "Nguyên liệu",
      "Danh mục": product.category?.categoryName || "",
      "Nhà cung cấp": product.supplier?.supplierName || "",
      "Đơn vị": product.unit,
      Barcode: product.barcode || "",
      "Giá nhập": product.purchasePrice || 0,
      "Giá bán lẻ": product.sellingPriceRetail || 0,
      "Giá bán sỉ": product.sellingPriceWholesale || 0,
      "Giá VIP": product.sellingPriceVip || 0,
      "Tồn tối thiểu": product.minStockLevel || 0,
      "Trạng thái":
        product.status === "active"
          ? "Hoạt động"
          : product.status === "inactive"
          ? "Tạm ngưng"
          : "Ngừng kinh doanh",
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 15 }, // SKU
      { wch: 30 }, // Tên sản phẩm
      { wch: 15 }, // Loại sản phẩm
      { wch: 20 }, // Danh mục
      { wch: 20 }, // Nhà cung cấp
      { wch: 10 }, // Đơn vị
      { wch: 15 }, // Barcode
      { wch: 12 }, // Giá nhập
      { wch: 12 }, // Giá bán lẻ
      { wch: 12 }, // Giá bán sỉ
      { wch: 12 }, // Giá VIP
      { wch: 12 }, // Tồn tối thiểu
      { wch: 15 }, // Trạng thái
    ];
    worksheet["!cols"] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sản phẩm");

    // Export file
    const fileName = `Danh_sach_san_pham_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
        <p className="text-red-800 dark:text-red-200">
          Lỗi khi tải danh sách nguyên liệu:{" "}
          {(error as any)?.message || "Unknown error"}
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
            Quản lý Nguyên Liệu
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý thông tin nguyên liệu
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Export Excel */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={products.length === 0}
          >
            <Download className="mr-2 h-5 w-5" />
            Xuất Excel
          </Button>

          {/* Add Product */}
          <Can permission="create_product">
            <Link href="/material/create">
              <Button variant="primary" size="sm">
                <Plus className="mr-2 h-5 w-5" />
                Thêm nguyên liệu
              </Button>
            </Link>
          </Can>
        </div>
      </div>
    
        
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Raw Materials Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-blue-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-blue-950">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-0" />
            {statsLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
            ) : (
            <>
                <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tổng nguyên liệu
                    </p>
                    <p className="mt-3 text-3xl font-bold text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover:scale-110">
                    {stats?.totalRawMaterials || 0}
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
                    Tổng số mặt hàng trong kho
                </p>
                </div>
            </>
            )}
        </div>

        {/* Low Stock Alert Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-yellow-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-yellow-950">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -z-0" />
            {statsLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
            ) : (
            <>
                <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Cảnh báo tồn kho thấp
                    </p>
                    <p className={`mt-3 text-3xl font-bold transition-all duration-300 group-hover:scale-110 ${
                    (stats?.lowStockCount || 0) > 0 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                    {stats?.lowStockCount || 0}
                    </p>
                </div>
                <div className="relative">
                    <div className={`absolute inset-0 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity ${
                    (stats?.lowStockCount || 0) > 0 ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className={`relative border-2 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                    (stats?.lowStockCount || 0) > 0 
                        ? 'border-yellow-500' 
                        : 'border-green-500'
                    }`}>
                    <AlertTriangle className={`h-7 w-7 ${
                        (stats?.lowStockCount || 0) > 0
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-green-600 dark:text-green-400'
                    }`} strokeWidth={2} />
                    </div>
                </div>
                </div>
                <div className="mt-4 pt-4 border-t border-yellow-200 dark:border-yellow-900">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                    {(stats?.lowStockCount || 0) > 0 ? 'Cần nhập hàng gấp' : 'Tồn kho ổn định'}
                </p>
                </div>
            </>
            )}
        </div>

        {/* Expiring Soon Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-orange-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-orange-950">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -z-0" />
            {statsLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
            ) : (
            <>
                <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Sắp hết hạn
                    </p>
                    <p className={`mt-3 text-3xl font-bold transition-all duration-300 group-hover:scale-110 ${
                    (stats?.expiringCount || 0) > 0 
                        ? 'text-orange-600 dark:text-orange-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                    {stats?.expiringCount || 0}
                    </p>
                </div>
                <div className="relative">
                    <div className={`absolute inset-0 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity ${
                    (stats?.expiringCount || 0) > 0 ? 'bg-orange-500' : 'bg-green-500'
                    }`} />
                    <div className={`relative border-2 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                    (stats?.expiringCount || 0) > 0 
                        ? 'border-orange-500' 
                        : 'border-green-500'
                    }`}>
                    <Clock className={`h-7 w-7 ${
                        (stats?.expiringCount || 0) > 0
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-green-600 dark:text-green-400'
                    }`} strokeWidth={2} />
                    </div>
                </div>
                </div>
                <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-900">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                    {(stats?.expiringCount || 0) > 0 ? 'Kiểm tra hạn sử dụng' : 'Không có cảnh báo'}
                </p>
                </div>
            </>
            )}
        </div>

        {/* Discontinued Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-red-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-red-950">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -z-0" />
            {statsLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
            ) : (
            <>
                <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Ngừng kinh doanh
                    </p>
                    <p className={`mt-3 text-3xl font-bold transition-all duration-300 group-hover:scale-110 ${
                    (stats?.discontinuedCount || 0) > 0 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                    {stats?.discontinuedCount || 0}
                    </p>
                </div>
                <div className="relative">
                    <div className={`absolute inset-0 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity ${
                    (stats?.discontinuedCount || 0) > 0 ? 'bg-red-500' : 'bg-green-500'
                    }`} />
                    <div className={`relative border-2 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                    (stats?.discontinuedCount || 0) > 0 
                        ? 'border-red-500' 
                        : 'border-green-500'
                    }`}>
                    <XCircle className={`h-7 w-7 ${
                        (stats?.discontinuedCount || 0) > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`} strokeWidth={2} />
                    </div>
                </div>
                </div>
                <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-900">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                    {(stats?.discontinuedCount || 0) > 0 ? 'Cần xử lý' : 'Không có mặt hàng ngừng'}
                </p>
                </div>
            </>
            )}
        </div>
        </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {/* Search */}
          <div>
            <label
              htmlFor="search"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Tìm kiếm
            </label>
            <input
              type="text"
              id="search"
              placeholder="Tên, SKU, Barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>


          {/* Category Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Danh mục
            </label>
            <SearchableSelect
              options={[
                { value: "all", label: "Tất cả" },
                ...categories.map((category) => ({
                  value: category.id,
                  label: category.categoryName,
                })),
              ]}
              value={categoryFilter}
              onChange={(value) => setCategoryFilter(value === "all" ? "all" : Number(value))}
              placeholder="Chọn danh mục..."
              isClearable={false}
            />
          </div>

          {/* Supplier Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nhà cung cấp
            </label>
            <SearchableSelect
              options={[
                { value: "all", label: "Tất cả" },
                ...suppliers.map((supplier) => ({
                  value: supplier.id,
                  label: supplier.supplierName,
                })),
              ]}
              value={supplierFilter}
              onChange={(value) => setSupplierFilter(value === "all" ? "all" : Number(value))}
              placeholder="Chọn nhà cung cấp..."
              isClearable={false}
            />
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
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "all" | "active" | "inactive" | "discontinued"
                )
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm ngưng</option>
              <option value="discontinued">Ngừng kinh doanh</option>
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
      </div>

      {/* Product Table */}
      <ProductTable
        data={products}
        name="Tên nguyên liệu"
        priceName="Giá nhập"
        isLoading={isLoading}
        enableSelection={false}
        onDelete={handleDeleteClick}
      />

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
            <span className="font-medium">{paginationMeta.total}</span> sản phẩm
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
        title="Xóa sản phẩm"
        message={`Bạn có chắc chắn muốn xóa sản phẩm "${deletingProduct?.productName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteProduct.isPending}
      />
    </div>
  );
}
