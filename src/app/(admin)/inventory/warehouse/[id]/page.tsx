"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useInventoryByWarehouse, useWarehouse } from "@/hooks/api";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { Can } from "@/components/auth";
import Badge from "@/components/ui/badge/Badge";
import { ApiResponse, Inventory, Warehouse } from "@/types";
import Pagination from "@/components/tables/Pagination";

export default function InventoryByWarehousePage() {
  const params = useParams();
  const router = useRouter();
  const warehouseId = Number(params.id);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterOutOfStock, setFilterOutOfStock] = useState(false);

  // Fetch thông tin kho
  const { data: warehouseResponse, isLoading: isLoadingWarehouse } = useWarehouse(warehouseId);
  const warehouse = warehouseResponse?.data as unknown as Warehouse;

  // Fetch tồn kho cho kho đó
  const { data: inventoryResponseWrapper, isLoading: isLoadingInventory, error } = useInventoryByWarehouse(warehouseId);
  const inventoryResponse = inventoryResponseWrapper as unknown as ApiResponse<Inventory[]>;

  // Client-side filtering and pagination
  const { filteredData, paginatedData } = useMemo(() => {
    if (!inventoryResponse?.data) return { filteredData: [], paginatedData: [] };

    const filtered = inventoryResponse.data.filter((item) => {
      // Search filter
      const matchesSearch =
        (item.product?.productName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.product?.sku?.toLowerCase() || "").includes(searchTerm.toLowerCase());

      // Low stock filter
      const matchesLowStock =
        !filterLowStock ||
        Number(item.quantity) - Number(item.reservedQuantity) < (Number(item.product?.minStockLevel) || 0);

      // Out of stock filter
      const matchesOutOfStock = !filterOutOfStock || Number(item.quantity) === 0;

      return matchesSearch && matchesLowStock && matchesOutOfStock;
    });

    // Paginate filtered data
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = filtered.slice(startIndex, endIndex);

    return { filteredData: filtered, paginatedData: paginated };
  }, [inventoryResponse?.data, searchTerm, filterLowStock, filterOutOfStock, page, limit]);

  // Calculate statistics from ALL data (not filtered)
  const stats = useMemo(() => {
    const allData = inventoryResponse?.data || [];

    if (!allData.length) {
      return {
        totalItems: 0,
        totalQuantity: 0,
        totalReserved: 0,
        totalAvailable: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
      };
    }

    return {
      totalItems: allData.length,
      totalQuantity: allData.reduce((sum, item) => sum + Number(item.quantity), 0),
      totalReserved: allData.reduce((sum, item) => sum + Number(item.reservedQuantity), 0),
      totalAvailable: allData.reduce(
        (sum, item) => sum + (Number(item.quantity) - Number(item.reservedQuantity)),
        0
      ),
      totalValue: allData.reduce((sum, item) => {
        const value = Number(item.quantity) * (Number(item.product?.purchasePrice) || 0);
        return sum + value;
      }, 0),
      lowStockItems: allData.filter(
        (item) =>
          Number(item.quantity) - Number(item.reservedQuantity) < (Number(item.product?.minStockLevel) || 0)
      ).length,
      outOfStockItems: allData.filter((item) => Number(item.quantity) === 0).length,
    };
  }, [inventoryResponse?.data]);

  // Pagination meta
  const paginationMeta = useMemo(() => {
    const total = filteredData.length;
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }, [filteredData.length, page, limit]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Get warehouse type label and color
  const getWarehouseTypeInfo = (type?: string) => {
    const types = {
      raw_material: { label: "Nguyên liệu", color: "blue" as const },
      packaging: { label: "Bao bì", color: "yellow" as const },
      finished_product: { label: "Thành phẩm", color: "green" as const },
      goods: { label: "Hàng hóa", color: "purple" as const },
    };
    return types[type as keyof typeof types] || { label: "N/A", color: "gray" as const };
  };

  const isLoading = isLoadingWarehouse || isLoadingInventory;

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
        <p className="text-red-800 dark:text-red-200">
          Lỗi khi tải dữ liệu tồn kho: {(error as any)?.message || "Unknown error"}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/10">
        <p className="text-yellow-800 dark:text-yellow-200">
          Không tìm thấy kho này
        </p>
      </div>
    );
  }

  const typeInfo = getWarehouseTypeInfo(warehouse.warehouseType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tồn kho: {warehouse.warehouseName}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge color={typeInfo.color}>{typeInfo.label}</Badge>
            <Badge color={warehouse.status === "active" ? "green" : "gray"}>
              {warehouse.status === "active" ? "Hoạt động" : "Ngưng"}
            </Badge>
            {warehouse.address && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                <svg
                  className="inline h-4 w-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {warehouse.address}
                {warehouse.city && `, ${warehouse.city}`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Quay lại
          </button>

          <Can permission="manage_inventory">
            <Link
              href={`/inventory/transactions?warehouseId=${warehouseId}`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nhập/Xuất kho
            </Link>
          </Can>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tổng sản phẩm */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tổng sản phẩm
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalItems}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
              <svg
                className="h-8 w-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Tổng số lượng */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tổng số lượng
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalQuantity.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Đặt giữ: {stats.totalReserved.toLocaleString()} | Khả dụng: {stats.totalAvailable.toLocaleString()}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
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
            </div>
          </div>
        </div>

        {/* Giá trị vốn */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Giá trị vốn
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {(stats.totalValue).toLocaleString("vi-VN")}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                VNĐ (giá nhập)
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/20">
              <svg
                className="h-8 w-8 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Cảnh báo */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Cảnh báo
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.lowStockItems}
                </span>
                <span className="text-sm text-gray-500">tồn thấp</span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.outOfStockItems}
                </span>
                <span className="text-sm text-gray-500">hết hàng</span>
              </div>
            </div>
            <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/20">
              <svg
                className="h-8 w-8 text-orange-600 dark:text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        {/* Search */}
        <div className="sm:col-span-2">
          <label
            htmlFor="search"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Tìm kiếm
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Reset to first page when searching
              }}
              className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              placeholder="Tìm theo tên hoặc mã sản phẩm..."
            />
          </div>
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
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
            <option value={100}>100 / trang</option>
          </select>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-4 sm:col-span-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filterLowStock}
              onChange={(e) => {
                setFilterLowStock(e.target.checked);
                setPage(1);
                if (filterOutOfStock) {
                  setFilterOutOfStock(false);
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
              checked={filterOutOfStock}
              onChange={(e) => {
                setFilterOutOfStock(e.target.checked);
                setPage(1);
                if (filterLowStock) {
                  setFilterLowStock(false);
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

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <InventoryTable
          inventory={paginatedData}
          isLoading={isLoadingInventory}
          showWarehouse={false}
        />
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
            <span className="font-medium">{paginationMeta.total}</span> sản phẩm
            {(searchTerm || filterLowStock || filterOutOfStock) &&
              ` (đã lọc từ ${inventoryResponse?.data?.length || 0} sản phẩm)`}
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
