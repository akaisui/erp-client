"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as XLSX from "xlsx";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCategoryStats,
  type CategoryStats,
} from "@/hooks/api";
import { categorySchema, type CategoryFormData } from "@/lib/validations/category.schema";
import { Can } from "@/components/auth";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/tables/Pagination";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import { CategoryTree } from "@/components/ui/tree";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { ApiResponse, Category, StatusCommon } from "@/types";
import { HomeIcon, Plus, Trash2, X, Eye, CheckCircle, XCircle, Layers, Edit, ChevronDown, ChevronRight, MoreVertical, Download, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { generateSlug } from "@/lib/utils";
import { MetricCard } from "@/components/dashboard/MetricCard";

// Export categories to Excel
const handleExportCategories = (categories: Category[]) => {
  if (!categories || categories.length === 0) {
    alert("Không có dữ liệu để xuất!");
    return;
  }

  const exportData = categories.map((category) => ({
    "Mã danh mục": category.categoryCode || "-",
    "Tên danh mục": category.categoryName,
    "Slug": category.slug || "-",
    "Danh mục cha": category.parent?.categoryName || "-",
    "Mô tả": category.description || "-",
    "Trạng thái": category.status === "active" ? "Hoạt động" : "Không hoạt động",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  const columnWidths = [
    { wch: 15 },
    { wch: 30 },
    { wch: 25 },
    { wch: 25 },
    { wch: 40 },
    { wch: 15 },
  ];
  worksheet["!cols"] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Danh mục");

  const fileName = `danh_muc_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

// Import categories from Excel
const handleImportCategories = async (
  file: File,
  existingCategories: Category[]
): Promise<{
  data: Array<any>;
  errors: Array<{ row: number; categoryName: string; message: string }>;
  duplicates: Array<{ row: number; categoryCode: string }>;
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

        const validCategories: any[] = [];
        const errors: Array<{ row: number; categoryName: string; message: string }> = [];
        const duplicates: Array<{ row: number; categoryCode: string }> = [];
        const processedCodes = new Set<string>();

        // Create a map of existing categories
        const existingCategoryMap = new Map<string, number>();
        existingCategories.forEach((cat) => {
          if (cat.categoryCode) {
            existingCategoryMap.set(cat.categoryCode.toUpperCase(), cat.id);
          }
        });

        const columnMapping: Record<string, string[]> = {
          categoryCode: ["Mã danh mục", "categoryCode", "Code"],
          categoryName: ["Tên danh mục", "categoryName", "Category Name"],
          slug: ["Slug", "slug"],
          parentName: ["Danh mục cha", "parentName", "Parent"],
          description: ["Mô tả", "description", "Description"],
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
          const categoryCode = getColumnValue(row, columnMapping.categoryCode);
          const categoryName = getColumnValue(row, columnMapping.categoryName);
          const parentName = getColumnValue(row, columnMapping.parentName);

          // Validate required fields
          if (!categoryCode || !categoryCode.toString().trim()) {
            errors.push({
              row: rowNumber,
              categoryName: categoryName?.toString() || "Unknown",
              message: "Mã danh mục là bắt buộc",
            });
            return;
          }

          const codeStr = categoryCode.toString().trim().toUpperCase();

          // Check for duplicates in existing data
          if (existingCategoryMap.has(codeStr)) {
            duplicates.push({
              row: rowNumber,
              categoryCode: codeStr,
            });
            return;
          }

          // Check for duplicates in current import
          if (processedCodes.has(codeStr)) {
            duplicates.push({
              row: rowNumber,
              categoryCode: codeStr,
            });
            return;
          }

          if (!categoryName || !categoryName.toString().trim()) {
            errors.push({
              row: rowNumber,
              categoryName: codeStr,
              message: "Tên danh mục là bắt buộc",
            });
            return;
          }

          // Find parent ID if parent name is provided
          let parentId = undefined;
          if (parentName && parentName.toString().trim()) {
            const parentNameStr = parentName.toString().trim().toLowerCase();
            const parentCategory = existingCategories.find(
              (cat) => cat.categoryName.toLowerCase() === parentNameStr
            );
            if (!parentCategory) {
              errors.push({
                row: rowNumber,
                categoryName: codeStr,
                message: `Danh mục cha "${parentName}" không tồn tại`,
              });
              return;
            }
            parentId = parentCategory.id;
          }

          // Parse status
          let status: "active" | "inactive" = "active";
          const statusVal = getColumnValue(row, columnMapping.status);
          if (statusVal && statusVal.toString().includes("Không hoạt động")) {
            status = "inactive";
          }

          validCategories.push({
            categoryCode: codeStr,
            categoryName: categoryName.toString().trim(),
            slug: getColumnValue(row, columnMapping.slug)?.toString().trim() || "",
            parentId,
            description: getColumnValue(row, columnMapping.description)?.toString().trim() || "",
            status,
          });

          processedCodes.add(codeStr);
        });

        resolve({
          data: validCategories,
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

export default function CategoriesPage() {
  // Pagination & Filter state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState<StatusCommon | "all">("all");
  const [parentFilter, setParentFilter] = useState<number | "root" | "all">("all");
  const [showTreeView, setShowTreeView] = useState(false);
  const [expandAll, setExpandAll] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // Import dialog state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importResult, setImportResult] = useState<{
    data: any[];
    errors: Array<{ row: number; categoryName: string; message: string }>;
    duplicates: Array<{ row: number; categoryCode: string }>;
  } | null>(null);

  // React Hook Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      categoryCode: "",
      categoryName: "",
      slug: "",
      parentId: null,
      description: "",
      status: "active",
    },
  });

  const categoryName = watch("categoryName");

  // Tự động tạo ra slug
  useEffect(() => {
    if (categoryName) {
      setValue("slug", generateSlug(categoryName));
    }
  }, [categoryName, setValue]);

  // Fetch loại hàng với phân trang trên server
  const { data: response, isLoading } = useCategories({
    page: showTreeView ? 1 : page,
    limit: showTreeView ? 1000 : limit,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(parentFilter !== "all" && {
      parentId: parentFilter === "root" ? ("null" as any) : parentFilter,
    })
  });
  const responseData = response as unknown as ApiResponse<Category[]>;

  // Fetch tất cả danh mục gốc cho filter dropdown
  const { data: rootCategoriesResponse } = useCategories({
    page: 1,
    limit: 100,
    parentId: "null" as any, 
    status: "active",
  });
  const rootCategories = (rootCategoriesResponse as unknown as ApiResponse<Category[]>)?.data || [];

  // Fetch ALL danh mục trong form
  const { data: allCategoriesResponse } = useCategories({
    page: 1,
    limit: 1000, // Get all danh mục
    status: "active",
  });
  const allCategories = (allCategoriesResponse as unknown as ApiResponse<Category[]>)?.data || [];

  // Reset page khi search thay đổi
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, parentFilter]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  }

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const { data: statsResponse, isLoading: statsLoading } = useCategoryStats();

  // Data từ response
  const categories = responseData?.data || [];
  const paginationMeta = responseData?.meta;
  console.log(paginationMeta);
  const stats = statsResponse as unknown as CategoryStats | undefined;

  const openCreateModal = () => {
    setEditingCategory(null);
    reset({
      categoryCode: "",
      categoryName: "",
      slug: "",
      parentId: null,
      description: "",
      status: "active",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    reset({
      categoryCode: category.categoryCode || "",
      categoryName: category.categoryName,
      slug: category.slug || "",
      parentId: category.parentId || null,
      description: category.description || "",
      status: category.status as "active" | "inactive",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    reset();
  };

  const openViewModal = (category: Category) => {
    setViewingCategory(category);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingCategory(null);
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          data,
        });
      } else {
        await createCategory.mutateAsync(data);
      }
      closeModal();
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const openDeleteDialog = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingCategory(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;

    try {
      await deleteCategory.mutateAsync(deletingCategory.id);
      closeDeleteDialog();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // Handle import file selection
  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await handleImportCategories(file, categories);
      setImportResult(result);
      setIsImportModalOpen(true);
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }

    // Reset file input
    event.target.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý Danh mục
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý danh mục sản phẩm trong hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Can permission="create_category">
            <Button
              variant="outline"
              size="ssmm"
              onClick={() => handleExportCategories(categories)}
              title="Xuất danh sách danh mục"
            >
              <Download className="mr-2 h-5 w-5" />
              Xuất Excel
            </Button>
          </Can>
          <Can permission="create_category">
            <div>
              <input
                id="import-excel"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportFile}
                className="hidden"
              />
              <label htmlFor="import-excel">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    const fileInput = document.getElementById("import-excel") as HTMLInputElement;
                    fileInput?.click();
                  }}
                  variant="outline"
                  size="ssmm"
                  title="Nhập danh sách danh mục từ Excel"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Nhập Excel
                </Button>
              </label>
            </div>
          </Can>
          {!showTreeView && (
            <Button
              variant="success"
              size="ssmm"
              onClick={() => setShowTreeView(true)}
              title="Xem dạng cây"
            >
              <Layers className="mr-2 h-5 w-5" />
              Xem cây thư mục
            </Button>
          )}
          {showTreeView && (
            <Button
              variant="success"
              size="ssmm"
              onClick={() => setShowTreeView(false)}
              title="Xem dạng bảng"
            >
              <Edit className="mr-2 h-5 w-5" />
              Xem bảng
            </Button>
          )}
          <Can permission="create_category">
            <Button variant="primary" size="smm" onClick={openCreateModal}>
              <Plus className="mr-2 h-5 w-5" />
              Thêm danh mục
            </Button>
          </Can>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Categories Card */}
        <MetricCard
          title="Tổng danh mục"
          value={stats?.totalCategories || 0}
          icon={<HomeIcon className="h-6 w-6" />}
          iconBg="bg-blue-100"
          loading={statsLoading}
          footerText="Tổng số danh mục"
          type="number"
        />

        {/* Active Categories Card */}
        <MetricCard
          title="Danh mục hoạt động"
          value={stats?.activeCategories || 0}
          icon={<CheckCircle className="h-6 w-6" />}
          iconBg="bg-green-100"
          loading={statsLoading}
          footerText="Danh mục đang hoạt động"
          type="number"
        />

        {/* Inactive Categories Card */}
        <MetricCard
          title="Danh mục không hoạt động"
          value={stats?.inactiveCategories || 0}
          icon={<XCircle className="h-6 w-6" />}
          iconBg="bg-red-100"
          loading={statsLoading}
          footerText="Danh mục tạm ngưng"
          type="number"
        />

        {/* Root Categories Card */}
        <MetricCard
          title="Danh mục gốc"
          value={stats?.rootCategories || 0}
          icon={<Layers className="h-6 w-6" />}
          iconBg="bg-purple-100"
          loading={statsLoading}
          footerText="Danh mục gốc trong hệ thống"
          type="number"
        />
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Tên hoặc mã danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Parent Category Filter */}
          {!showTreeView && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Danh mục cha
              </label>
              <select
                value={parentFilter === undefined ? "all" : parentFilter === "root" ? "root" : parentFilter}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "all") setParentFilter("all");
                  else if (value === "root") setParentFilter("root");
                  else setParentFilter(Number(value));
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">Tất cả</option>
                <option value="root">Danh mục gốc</option>
                {rootCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Trạng thái
            </label>
            <select
              value={statusFilter || "all"}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>

          {/* Items per page - Only show in table view */}
          {!showTreeView && (
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
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
                <option value={100}>100 / trang</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tree View Controls */}
      {showTreeView && categories.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hiển thị tất cả {categories.length} danh mục
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant={expandAll ? "primary" : "outline"}
                size="sm"
                onClick={() => setExpandAll(!expandAll)}
                title={expandAll ? "Thu gọn tất cả" : "Mở rộng tất cả"}
              >
                {expandAll ? (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Thu gọn tất cả
                  </>
                ) : (
                  <>
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Mở rộng tất cả
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table or Tree View */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500">
            <p>Không có danh mục nào</p>
          </div>
        ) : showTreeView ? (
          <div className="p-4">
            <CategoryTree
              categories={categories}
              expandAll={expandAll}
              onEdit={openEditModal}
              onView={openViewModal}
              onDelete={openDeleteDialog}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Mã
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tên danh mục
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Danh mục cha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {category.categoryCode || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {category.categoryName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {category.slug || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {category.parent?.categoryName || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <Badge color={category.status === "active" ? "green" : "gray"}>
                        {category.status === "active" ? "Hoạt động" : "Không hoạt động"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="relative flex items-center justify-end gap-1">
                        {/* Quick View Link */}
                        <button
                          onClick={() => openViewModal(category)}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Dropdown Menu */}
                        <div className="relative">
                          <Button
                            onClick={() =>
                              setOpenDropdownId(
                                openDropdownId === category.id ? null : category.id
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
                            isOpen={openDropdownId === category.id}
                            onClose={() => setOpenDropdownId(null)}
                            className="w-56"
                          >
                            {/* Chỉnh sửa */}
                            <Can permission="update_product">
                              <DropdownItem
                                onClick={() => {
                                  openEditModal(category);
                                  setOpenDropdownId(null);
                                }}
                                className="text-blue-600! hover:bg-blue-50! dark:text-blue-400! dark:hover:bg-blue-900/20!"
                              >
                                <div className="flex items-center gap-2">
                                  <Edit className="h-4 w-4" />
                                  <span>Chỉnh sửa</span>
                                </div>
                              </DropdownItem>
                            </Can>

                            {/* Xóa */}
                            <Can permission="delete_product">
                              <DropdownItem
                                onClick={() => {
                                  openDeleteDialog(category);
                                  setOpenDropdownId(null);
                                }}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination - Only show in table view */}
      {!showTreeView && paginationMeta && paginationMeta.total > 0 && (
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
            <span className="font-medium">{paginationMeta.total}</span> danh mục
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90vh] rounded-lg bg-white shadow-xl dark:bg-gray-900 flex flex-col">
            <div className="p-6 pb-4 flex items-center justify-between flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingCategory ? "Sửa danh mục" : "Thêm danh mục mới"}
              </h2>
              <button
                onClick={closeModal}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="space-y-4 p-6 overflow-y-auto flex-1">
                {/* Category Code */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mã danh mục <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("categoryCode")}
                    placeholder="VD: DM-001"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  {errors.categoryCode && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.categoryCode.message}
                    </p>
                  )}
                </div>

                {/* Category Name */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tên danh mục <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("categoryName")}
                    placeholder="Nhập tên danh mục"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  {errors.categoryName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.categoryName.message}
                    </p>
                  )}
                </div>

                {/* Slug (Read-only) */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Slug (tự động)
                  </label>
                  <input
                    type="text"
                    {...register("slug")}
                    readOnly
                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  />
                </div>

                {/* Parent Category */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Danh mục cha
                  </label>
                  <select
                    {...register("parentId", { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    size={1}
                  >
                    <option value="">-- Không có (Danh mục gốc) --</option>
                    {allCategories
                      ?.filter((cat) => cat.id !== editingCategory?.id)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.parent?.categoryName ? `${cat.parent.categoryName} → ` : ""}
                          {cat.categoryName}
                        </option>
                      ))}
                  </select>
                  {errors.parentId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.parentId.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mô tả
                  </label>
                  <textarea
                    {...register("description")}
                    placeholder="Nhập mô tả..."
                    rows={3}
                    maxLength={500}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Trạng thái
                  </label>
                  <select
                    {...register("status")}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.status.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting || createCategory.isPending || updateCategory.isPending}
                >
                  {editingCategory ? "Cập nhật" : "Tạo mới"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && viewingCategory && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl dark:bg-gray-900 my-8 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Chi tiết danh mục
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {viewingCategory.categoryName}
                </p>
              </div>
              <button
                onClick={closeViewModal}
                className="rounded-full p-2 hover:bg-white/50 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Mã danh mục */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                    Mã danh mục
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {viewingCategory.categoryCode || "-"}
                  </p>
                </div>

                {/* Trạng thái */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                    Trạng thái
                  </label>
                  <Badge color={viewingCategory.status === "active" ? "green" : "gray"}>
                    {viewingCategory.status === "active" ? "Hoạt động" : "Không hoạt động"}
                  </Badge>
                </div>

                {/* Tên danh mục */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                    Tên danh mục
                  </label>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {viewingCategory.categoryName}
                  </p>
                </div>

                {/* Slug */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                    Slug
                  </label>
                  <p className="break-all font-mono text-sm text-gray-700 dark:text-gray-300">
                    {viewingCategory.slug || "-"}
                  </p>
                </div>

                {/* Danh mục cha */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                    Danh mục cha
                  </label>
                  <p className="text-base font-medium text-gray-900 dark:text-white">
                    {viewingCategory.parent?.categoryName || <span className="text-gray-400">—</span>}
                  </p>
                </div>

                {/* Số sản phẩm */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                    Số sản phẩm
                  </label>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {viewingCategory._count?.products || 0}
                  </p>
                </div>

                {/* Mô tả */}
                {viewingCategory.description && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 md:col-span-2">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      Mô tả
                    </label>
                    <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                      {viewingCategory.description}
                    </p>
                  </div>
                )}

                {/* Ngày tạo & cập nhật */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                    Ngày tạo
                  </label>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {viewingCategory.createdAt
                      ? new Date(viewingCategory.createdAt).toLocaleDateString("vi-VN")
                      : "-"}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                    Cập nhật lần cuối
                  </label>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {viewingCategory.updatedAt
                      ? new Date(viewingCategory.updatedAt).toLocaleDateString("vi-VN")
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
              <Button variant="outline" onClick={closeViewModal}>
                Đóng
              </Button>
              <Can permission="update_category">
                <Button 
                  variant="primary" 
                  onClick={() => {
                    openEditModal(viewingCategory);
                    closeViewModal();
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Chỉnh sửa
                </Button>
              </Can>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa danh mục"
        message={`Bạn có chắc chắn muốn xóa danh mục "${deletingCategory?.categoryName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteCategory.isPending}
      />

      {/* Import Preview Modal */}
      {isImportModalOpen && importResult && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl dark:bg-gray-900 max-h-[80vh] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Xem trước Danh mục
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
                    Danh mục sẽ được nhập ({importResult.data.length})
                  </h3>
                  <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Mã</th>
                          <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Tên</th>
                          <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {importResult.data.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-2 text-gray-900 dark:text-white">{item.categoryCode}</td>
                            <td className="px-4 py-2 text-gray-900 dark:text-white">{item.categoryName}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                item.status === "active"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                              }`}>
                                {item.status === "active" ? "Hoạt động" : "Không hoạt động"}
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
                        {error.categoryName && (
                          <p className="text-xs text-red-600 dark:text-red-500">Danh mục: {error.categoryName}</p>
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
                        <p className="text-yellow-700 dark:text-yellow-400">Mã "{dup.categoryCode}" đã tồn tại trong hệ thống</p>
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
                      await createCategory.mutateAsync(item);
                    }
                    setIsImportModalOpen(false);
                    setImportResult(null);
                    alert("Nhập danh mục thành công!");
                  } catch (error: any) {
                    alert(`Lỗi: ${error.message}`);
                  }
                }}
                isLoading={createCategory.isPending}
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
