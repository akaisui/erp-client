"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  useProducts,
  useDeleteProduct,
  useCategories,
  useSuppliers,
  useWarehouses,
  usePackagingStats,
  useCreateProduct,
} from "@/hooks/api";
import { Can } from "@/components/auth";
import { ProductTable } from "@/components/products";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/tables/Pagination";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import ImportPreviewModal from "@/components/ui/modal/ImportPreviewModal";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { ApiResponse, Category, PackagingStats, Product, Supplier, Warehouse, type ProductStatus } from "@/types";
import { Download, Plus, AlertTriangle, Clock, DollarSign, Package, Printer, Upload, X, RotateCcw } from "lucide-react";
import { useDebounce } from "@/hooks";
import { handleExportExcelPackaging, handleImportExcelPackaging } from "@/lib/excel";
import { handlePrintBarcodes } from "@/lib/barecode";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

export default function FinishedProductPage() {
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
  const [warehouseFilter, setWarehouseFilter] = useState<number | "all">("all");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Import states
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<Array<{ row: number; sku: string; message: string }>>([]);
  const [importDuplicates, setImportDuplicates] = useState<Array<{ row: number; sku: string }>>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch finished product stats
  const { data: statsResponse, isLoading: statsLoading } = usePackagingStats();

  // Fetch thành phẩm với phân trang
  const { data, isLoading, error } = useProducts({
    page,
    limit,
    productType: 'finished_product',
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(categoryFilter !== "all" && { categoryId: categoryFilter }),
    ...(supplierFilter !== "all" && { supplierId: supplierFilter }),
    ...(warehouseFilter !== "all" && { warehouseId: warehouseFilter }),
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
  const { data: warehousesResponse } = useWarehouses({ 
    status: "active",
    warehouseType: "finished_product",
    limit: 1000,
  });
  const warehousesTemp = warehousesResponse as unknown as ApiResponse<Warehouse[]>;

  const deleteProduct = useDeleteProduct();
  const createProduct = useCreateProduct();

  const categories = categoriesTemp?.data || [];
  const suppliers = suppliersTemp?.data || [];
  const warehouses = warehousesTemp?.data || [];

  const products = response?.data || [];
  const paginationMeta = response?.meta;
  const stats = statsResponse as unknown as PackagingStats | undefined;

  // Reset lại page 1 khi thay đổi filter hoặc search
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, categoryFilter, supplierFilter]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSupplierFilter("all");
    setWarehouseFilter("all");
  };

  const hasActiveFilters = 
    searchTerm !== "" || 
    statusFilter !== "all" || 
    categoryFilter !== "all" || 
    supplierFilter !== "all" || 
    warehouseFilter !== "all";

  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const existingSkus = new Set(products.map((p) => p.sku.toUpperCase()));
      
      const result = await handleImportExcelPackaging(
        file,
        existingSkus,
        categories,
        suppliers
      );

      setImportData(result.data);
      setImportErrors(result.errors);
      setImportDuplicates(result.duplicates);
      setShowImportPreview(true);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi đọc file Excel");
    }
  };

  const handleConfirmImport = async () => {
    if (importData.length === 0) {
      toast.error("Không có dữ liệu hợp lệ để nhập");
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const productData of importData) {
      try {
        await createProduct.mutateAsync(productData);
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    setIsImporting(false);
    setShowImportPreview(false);
    setImportData([]);
    setImportErrors([]);
    setImportDuplicates([]);

    if (failCount === 0) {
      toast.success(`✅ Nhập thành công ${successCount} bao bì!`);
    } else {
      toast.success(
        `⚠️ Nhập ${successCount}/${importData.length} bao bì. ${failCount} lỗi.`
      );
    }
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

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
        <p className="text-red-800 dark:text-red-200">
          Lỗi khi tải danh sách thành phẩm:{" "}
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
            Quản lý Thành phẩm
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý thông tin thành phẩm trong hệ thống
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Import Excel */}
          <Can permission="create_product">
            <Button
              variant="outline"
              size="smm"
              onClick={handleImportClick}
            >
              <Upload className="mr-2 h-5 w-5" />
              Nhập Excel
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
          </Can>

          {/* Export Excel */}
          <Button
            variant="outline"
            size="smm"
            onClick={() => handleExportExcelPackaging(products)}
            disabled={products.length === 0}
          >
            <Download className="mr-2 h-5 w-5" />
            Xuất Excel
          </Button>

          {/* Print Barcodes */}
          <Button
            variant="success"
            size="smm"
            onClick={() => handlePrintBarcodes(products)}
            disabled={products.length === 0}
          >
            <Printer className="mr-2 h-5 w-5" />
            In mã vạch
          </Button>

          {/* Add Product */}
          <Can permission="create_product">
            <Link href="/finished-product/create">
              <Button variant="primary" size="smm">
                <Plus className="mr-2 h-5 w-5" />
                Thêm thành phẩm
              </Button>
            </Link>
          </Can>
        </div>
      </div>
    
        
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Finished Products Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-blue-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-blue-950">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-0" />
            {statsLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
            ) : (
            <>
                <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Tổng thành phẩm
                    </p>
                    <p className="mt-3 text-3xl font-bold text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover:scale-110">
                    {stats?.totalPackaging || 0}
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
                    Tổng số thành phẩm trong kho
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

        {/* Inventory Value Card */}
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-emerald-50 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.02] dark:border-gray-800 dark:from-gray-900 dark:to-emerald-950">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-0" />
            {statsLoading ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
            ) : (
            <>
                <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Giá trị kho thành phẩm
                    </p>
                    <p className="mt-3 text-3xl font-bold text-emerald-600 dark:text-emerald-400 transition-all duration-300 group-hover:scale-110">
                    {formatCurrency(stats?.totalInventoryValue || 0)}
                    </p>
                </div>
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative border-2 border-emerald-500 rounded-xl p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <DollarSign className="h-7 w-7 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                    </div>
                </div>
                </div>
                <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-900">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                    Tổng: Tồn kho × Giá nhập
                </p>
                </div>
            </>
            )}
        </div>
        </div>

      {/* Search Bar */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Tên, SKU, Barcode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
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

          {/* Warehouse Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Kho
            </label>
            <SearchableSelect
              options={[
                { value: "all", label: "Tất cả" },
                ...warehouses.map((warehouse) => ({
                  value: warehouse.id,
                  label: warehouse.warehouseName,
                })),
              ]}
              value={warehouseFilter}
              onChange={(value) => setWarehouseFilter(value === "all" ? "all" : Number(value))}
              placeholder="Chọn kho..."
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
              <option value="active">Đang dùng</option>
              <option value="inactive">Ngừng nhập</option>
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

            {categoryFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                Danh mục: {categories.find((c) => c.id === categoryFilter)?.categoryName || categoryFilter}
                <button
                  onClick={() => setCategoryFilter("all")}
                  className="hover:text-purple-900 dark:hover:text-purple-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {supplierFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-sm text-pink-700 dark:bg-pink-900/20 dark:text-pink-400">
                NCC: {suppliers.find((s) => s.id === supplierFilter)?.supplierName || supplierFilter}
                <button
                  onClick={() => setSupplierFilter("all")}
                  className="hover:text-pink-900 dark:hover:text-pink-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {warehouseFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                Kho: {warehouses.find((w) => w.id === warehouseFilter)?.warehouseName || warehouseFilter}
                <button
                  onClick={() => setWarehouseFilter("all")}
                  className="hover:text-indigo-900 dark:hover:text-indigo-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                Trạng thái: {statusFilter === "active" ? "Đang dùng" : statusFilter === "inactive" ? "Ngừng nhập" : "Ngừng kinh doanh"}
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

      {/* Product Table */}
      <ProductTable
        data={products}
        urlProduct="finished-product"
        name="Tên thành phẩm"
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
            <span className="font-medium">{paginationMeta.total}</span> thành phẩm
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
        title="Xóa thành phẩm"
        message={`Bạn có chắc chắn muốn xóa thành phẩm "${deletingProduct?.productName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteProduct.isPending}
      />

      {/* Import Preview Modal */}
      <ImportPreviewModal
        isOpen={showImportPreview}
        onClose={() => {
          setShowImportPreview(false);
          setImportData([]);
          setImportErrors([]);
          setImportDuplicates([]);
        }}
        onConfirm={handleConfirmImport}
        validCount={importData.length}
        errorCount={importErrors.length}
        duplicateCount={importDuplicates.length}
        errors={importErrors}
        duplicates={importDuplicates}
        isLoading={isImporting}
      />
    </div>
  );
}
