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
  useWarehouses,
  useCreateProduct,
} from "@/hooks/api";
import { Can } from "@/components/auth";
import { ProductTable } from "@/components/products";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/tables/Pagination";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { ApiResponse, Category, Product, RawMaterialStats, Supplier, Warehouse, type ProductStatus } from "@/types";
import { Download, Plus, AlertTriangle, Clock, DollarSign, Package, Printer, Upload, CheckCircle2, X } from "lucide-react";
import { useDebounce } from "@/hooks";
import { handleExportExcelMaterial } from "@/lib/excel";
import { handlePrintBarcodes } from "@/lib/barecode";
import { formatCurrency } from "@/lib/utils";

// Import materials from Excel
const handleImportMaterials = async (
  file: File,
  existingProducts: Product[],
  categories: Category[],
  suppliers: Supplier[]
): Promise<{
  data: Array<any>;
  errors: Array<{ row: number; sku: string; message: string }>;
  duplicates: Array<{ row: number; sku: string }>;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const validProducts: any[] = [];
        const errors: Array<{ row: number; sku: string; message: string }> = [];
        const duplicates: Array<{ row: number; sku: string }> = [];
        const processedSkus = new Set<string>();

        // Create a map of existing SKUs
        const existingSkuMap = new Map<string, number>();
        existingProducts.forEach((prod) => {
          if (prod.sku) {
            existingSkuMap.set(prod.sku.toUpperCase(), prod.id);
          }
        });

        const columnMapping: Record<string, string[]> = {
          sku: ["SKU", "sku", "Mã SKU"],
          productName: ["Tên sản phẩm", "productName", "Product Name"],
          categoryName: ["Danh mục", "categoryName", "Category"],
          supplierName: ["Nhà cung cấp", "supplierName", "Supplier"],
          unit: ["Đơn vị", "unit", "Unit"],
          barcode: ["Barcode", "barcode", "Mã vạch"],
          purchasePrice: ["Giá nhập", "purchasePrice", "Purchase Price"],
          sellingPriceRetail: ["Giá bán lẻ", "sellingPriceRetail", "Retail Price"],
          sellingPriceWholesale: ["Giá bán sỉ", "sellingPriceWholesale", "Wholesale Price"],
          sellingPriceVip: ["Giá VIP", "sellingPriceVip", "VIP Price"],
          minStockLevel: ["Tồn tối thiểu", "minStockLevel", "Min Stock"],
          status: ["Trạng thái", "status", "Status"],
        };

        const getColumnValue = (row: any, columnAlternatives: string[]) => {
          for (const alt of columnAlternatives) {
            if (row[alt] !== undefined && row[alt] !== null && row[alt] !== "") {
              return row[alt];
            }
          }
          return undefined;
        };

        jsonData.forEach((row: any, index: number) => {
          const rowNumber = index + 2;
          const sku = getColumnValue(row, columnMapping.sku);
          const productName = getColumnValue(row, columnMapping.productName);
          const unit = getColumnValue(row, columnMapping.unit);
          const categoryName = getColumnValue(row, columnMapping.categoryName);
          const supplierName = getColumnValue(row, columnMapping.supplierName);

          // Validate required fields
          if (!sku || !sku.toString().trim()) {
            errors.push({
              row: rowNumber,
              sku: sku || "N/A",
              message: "SKU là bắt buộc",
            });
            return;
          }

          const skuStr = sku.toString().trim().toUpperCase();

          // Check for duplicates in existing data
          if (existingSkuMap.has(skuStr)) {
            duplicates.push({
              row: rowNumber,
              sku: skuStr,
            });
            return;
          }

          // Check for duplicates in current import
          if (processedSkus.has(skuStr)) {
            duplicates.push({
              row: rowNumber,
              sku: skuStr,
            });
            return;
          }

          if (!productName || !productName.toString().trim()) {
            errors.push({
              row: rowNumber,
              sku: skuStr,
              message: "Tên sản phẩm là bắt buộc",
            });
            return;
          }

          if (!unit || !unit.toString().trim()) {
            errors.push({
              row: rowNumber,
              sku: skuStr,
              message: "Đơn vị là bắt buộc",
            });
            return;
          }

          // Find category ID
          let categoryId = undefined;
          if (categoryName && categoryName.toString().trim()) {
            const category = categories.find(
              (c) => c.categoryName.toLowerCase() === categoryName.toString().trim().toLowerCase()
            );
            if (!category) {
              errors.push({
                row: rowNumber,
                sku: skuStr,
                message: `Danh mục "${categoryName}" không tồn tại`,
              });
              return;
            }
            categoryId = category.id;
          }

          // Find supplier ID
          let supplierId = undefined;
          if (supplierName && supplierName.toString().trim()) {
            const supplier = suppliers.find(
              (s) => s.supplierName.toLowerCase() === supplierName.toString().trim().toLowerCase()
            );
            if (!supplier) {
              errors.push({
                row: rowNumber,
                sku: skuStr,
                message: `Nhà cung cấp "${supplierName}" không tồn tại`,
              });
              return;
            }
            supplierId = supplier.id;
          }

          // Parse prices
          const parsePrice = (val: any) => {
            const num = parseFloat(val);
            return isNaN(num) || num < 0 ? 0 : num;
          };

          const purchasePrice = parsePrice(getColumnValue(row, columnMapping.purchasePrice) || 0);
          const sellingPriceRetail = parsePrice(
            getColumnValue(row, columnMapping.sellingPriceRetail) || 0
          );
          const sellingPriceWholesale = parsePrice(
            getColumnValue(row, columnMapping.sellingPriceWholesale) || 0
          );
          const sellingPriceVip = parsePrice(getColumnValue(row, columnMapping.sellingPriceVip) || 0);
          const minStockLevel = parsePrice(getColumnValue(row, columnMapping.minStockLevel) || 0);

          // Parse status
          let status: "active" | "inactive" | "discontinued" = "active";
          const statusVal = getColumnValue(row, columnMapping.status);
          if (statusVal) {
            const statusStr = statusVal.toString().toLowerCase().trim();
            if (statusStr === "tạm ngưng" || statusStr === "inactive") {
              status = "inactive";
            } else if (statusStr === "ngừng kinh doanh" || statusStr === "discontinued") {
              status = "discontinued";
            }
          }

          validProducts.push({
            sku: skuStr,
            productName: productName.toString().trim(),
            productType: "raw_material",
            categoryId,
            supplierId,
            unit: unit.toString().trim(),
            barcode: getColumnValue(row, columnMapping.barcode)?.toString().trim() || undefined,
            purchasePrice,
            sellingPriceRetail,
            sellingPriceWholesale,
            sellingPriceVip,
            minStockLevel,
            status,
          });

          processedSkus.add(skuStr);
        });

        resolve({
          data: validProducts,
          errors,
          duplicates,
        });
      } catch (error: any) {
        reject(new Error(`Lỗi khi đọc file: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Lỗi khi đọc file"));
    };

    reader.readAsBinaryString(file);
  });
};

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
  const [warehouseFilter, setWarehouseFilter] = useState<number | "all">("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importResult, setImportResult] = useState<{
    data: any[];
    errors: Array<{ row: number; sku: string; message: string }>;
    duplicates: Array<{ row: number; sku: string }>;
  } | null>(null);

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
    warehouseType: "raw_material",
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

  // Handle import file selection
  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await handleImportMaterials(file, products, categories, suppliers);
      setImportResult(result);
      setIsImportModalOpen(true);
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }

    // Reset file input
    event.target.value = "";
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
            size="smm"
            onClick={() => handleExportExcelMaterial(products)}
            disabled={products.length === 0}
          >
            <Download className="mr-2 h-5 w-5" />
            Xuất Excel
          </Button>

          {/* Import Excel */}
          <div>
            <input
              id="import-excel-material"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportFile}
              className="hidden"
            />
            <label htmlFor="import-excel-material">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  const fileInput = document.getElementById("import-excel-material") as HTMLInputElement;
                  fileInput?.click();
                }}
                variant="outline"
                size="smm"
                title="Nhập danh sách nguyên liệu từ Excel"
              >
                <Upload className="mr-2 h-5 w-5" />
                Nhập Excel
              </Button>
            </label>
          </div>

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
            <Link href="/material/create">
              <Button variant="primary" size="smm">
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
                    Giá trị kho nguyên liệu
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

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
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
        urlProduct="material"
        name="Tên nguyên liệu"
        priceName="Giá nhập"
        priceKey="purchasePrice"
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
        title="Xóa nguyên liệu"
        message={`Bạn có chắc chắn muốn xóa nguyên liệu "${deletingProduct?.productName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteProduct.isPending}
      />

      {/* Import Preview Modal */}
      {isImportModalOpen && importResult && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl dark:bg-gray-900 max-h-[80vh] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Xem trước Nguyên Liệu
              </h2>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Summary */}
              <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <p className="text-sm text-green-600 dark:text-green-400">Hợp lệ</p>
                  <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                    {importResult.data.length}
                  </p>
                </div>
                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm text-red-600 dark:text-red-400">Lỗi</p>
                  <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                    {importResult.errors.length}
                  </p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Trùng lặp</p>
                  <p className="mt-1 text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {importResult.duplicates.length}
                  </p>
                </div>
              </div>

              {/* Valid Data */}
              {importResult.data.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Nguyên liệu sẽ được nhập ({importResult.data.length})
                  </h3>
                  <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">SKU</th>
                          <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Tên</th>
                          <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Danh mục</th>
                          <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {importResult.data.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-2 text-gray-900 dark:text-white font-mono">{item.sku}</td>
                            <td className="px-4 py-2 text-gray-900 dark:text-white">{item.productName}</td>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                              {categories.find(c => c.id === item.categoryId)?.categoryName || "-"}
                            </td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                item.status === "active"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                              }`}>
                                {item.status === "active" ? "Hoạt động" : "Tạm ngưng"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Lỗi ({importResult.errors.length})
                  </h3>
                  <div className="space-y-2">
                    {importResult.errors.map((error, idx) => (
                      <div key={idx} className="rounded border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900/30 dark:bg-red-900/10">
                        <p className="font-medium text-red-800 dark:text-red-300">Hàng {error.row}</p>
                        <p className="text-red-700 dark:text-red-400">{error.message}</p>
                        {error.sku && (
                          <p className="text-xs text-red-600 dark:text-red-500">SKU: {error.sku}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicates */}
              {importResult.duplicates.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Trùng lặp ({importResult.duplicates.length})
                  </h3>
                  <div className="space-y-2">
                    {importResult.duplicates.map((dup, idx) => (
                      <div key={idx} className="rounded border border-yellow-200 bg-yellow-50 p-3 text-sm dark:border-yellow-900/30 dark:bg-yellow-900/10">
                        <p className="font-medium text-yellow-800 dark:text-yellow-300">Hàng {dup.row}</p>
                        <p className="text-yellow-700 dark:text-yellow-400">SKU "{dup.sku}" đã tồn tại trong hệ thống</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
              <Button
                variant="outline"
                onClick={() => setIsImportModalOpen(false)}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  try {
                    for (const item of importResult.data) {
                      await createProduct.mutateAsync(item);
                    }
                    setIsImportModalOpen(false);
                    setImportResult(null);
                    alert("Nhập nguyên liệu thành công!");
                  } catch (error: any) {
                    alert(`Lỗi: ${error.message}`);
                  }
                }}
                isLoading={createProduct.isPending}
              >
                Nhập ({importResult.data.length})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
