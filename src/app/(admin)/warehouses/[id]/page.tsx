"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  useWarehouse,
  useDeleteWarehouse,
  useWarehouseStatistics,
  useInventoryByWarehouse,
  useStockTransactions,
} from "@/hooks/api";
import { Can } from "@/components/auth";
import Badge from "@/components/ui/badge/Badge";
import { InventoryTableByWarehouse } from "@/components/inventory";
import { InventoryByWarehouseResponse, StockTransaction, Warehouse, WarehouseStatistics, WarehouseType } from "@/types";
import type { ApexOptions } from "apexcharts";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Package,
  BarChart3,
  DollarSign,
  Activity,
  Mail,
  Phone,
  FileText,
  Download,
  Upload,
  Edit,
  CheckSquare,
  Share2,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function WarehouseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const warehouseId = Number(params.id);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: responseWrapper, isLoading, error } = useWarehouse(warehouseId);
  const response = responseWrapper?.data as unknown as Warehouse;
  const { data: statsResponseWrapper, isLoading: statsLoading } = useWarehouseStatistics(warehouseId);
  const statsResponse = statsResponseWrapper?.data as unknown as WarehouseStatistics;
  const { data: inventoryResponseWrapper, isLoading: inventoryLoading } = useInventoryByWarehouse(warehouseId);
  const inventoryResponse = inventoryResponseWrapper?.data as unknown as InventoryByWarehouseResponse[];
  const { data: transactionsResponseWrapper, isLoading: transactionsLoading } = useStockTransactions({
    warehouseId: warehouseId,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const transactionsResponse = transactionsResponseWrapper?.data as unknown as StockTransaction[];
  const deleteWarehouse = useDeleteWarehouse();

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!response) return;
    try {
      await deleteWarehouse.mutateAsync(warehouseId);
      router.push("/warehouses");
    } catch (error) {} finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const getTypeLabel = (type: WarehouseType) => {
    const labels: Record<WarehouseType, string> = {
      raw_material: "Nguyên liệu",
      packaging: "Bao bì",
      finished_product: "Thành phẩm",
      goods: "Hàng hóa",
    };
    return labels[type];
  };

  const getTypeBadgeColor = (type: WarehouseType): "blue" | "yellow" | "green" | "purple" => {
    const colors: Record<WarehouseType, "blue" | "yellow" | "green" | "purple"> = {
      raw_material: "blue",
      packaging: "yellow",
      finished_product: "green",
      goods: "purple",
    };
    return colors[type];
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      import: "Nhập kho",
      export: "Xuất kho",
      transfer: "Chuyển kho",
      disposal: "Hủy hàng",
      stocktake: "Kiểm kê",
    };
    return labels[type] || type;
  };

  const getTransactionStatusInfo = (status: string): { label: string; color: "gray" | "yellow" | "blue" | "green" | "red" } => {
    const info: Record<string, { label: string; color: "gray" | "yellow" | "blue" | "green" | "red" }> = {
      draft: { label: "Nháp", color: "gray" },
      pending: { label: "Chờ duyệt", color: "yellow" },
      approved: { label: "Đã duyệt", color: "blue" },
      completed: { label: "Hoàn thành", color: "green" },
      cancelled: { label: "Đã hủy", color: "red" },
    };
    return info[status] || { label: status, color: "gray" };
  };

  const transactionChartData: ApexOptions = React.useMemo(() => {
    if (!statsResponse) {
      return {
        series: [],
        chart: { type: "donut", height: 300 },
      };
    }

    const stats = statsResponse;
    const transactionTypes = Object.entries(stats.transactions.last30Days);

    if (transactionTypes.length === 0) {
      return {
        series: [],
        chart: { type: "donut", height: 300 },
      };
    }

    const typeLabels: Record<string, string> = {
      import: "Nhập kho",
      export: "Xuất kho",
      transfer: "Chuyển kho",
      disposal: "Hủy hàng",
      stocktake: "Kiểm kê",
    };

    const typeColors: Record<string, string> = {
      import: "#10b981",
      export: "#ef4444",
      transfer: "#3b82f6",
      disposal: "#f59e0b",
      stocktake: "#8b5cf6",
    };

    return {
      series: transactionTypes.map(([_, count]) => count),
      chart: {
        type: "donut",
        height: 300,
      },
      labels: transactionTypes.map(([type, _]) => typeLabels[type] || type),
      colors: transactionTypes.map(([type, _]) => typeColors[type] || "#6b7280"),
      legend: {
        position: "bottom",
        fontSize: "12px",
      },
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Tổng",
                fontSize: "14px",
                fontWeight: 600,
                color: "#374151",
                formatter: () => {
                  const total = transactionTypes.reduce((sum, [_, count]) => sum + count, 0);
                  return total.toString();
                },
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(0)}%`,
      },
      tooltip: {
        y: {
          formatter: (value) => `${value} giao dịch`,
        },
      },
    };
  }, [statsResponse]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
        <p className="text-red-800 dark:text-red-200">
          Lỗi khi tải thông tin kho: {(error as any)?.message || "Unknown error"}
        </p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/10">
        <p className="text-yellow-800 dark:text-yellow-200">Không tìm thấy kho này</p>
      </div>
    );
  }

  const warehouse = response;
  const stats = statsResponse;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chi tiết kho</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Thông tin chi tiết về kho: {warehouse.warehouseName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
              onClick={() => router.push(`/warehouses/${warehouse.id}/edit`)}
              size="ssmm"
              variant="outline"
            >
            <ArrowLeft className="h-5 w-5" />
            Quay lại
          </Button>

          <Can permission="create_stock_transactions">
            <Button
              onClick={() => router.push(`/inventory/transactions/create/stocktake?warehouse=${warehouseId}`)}
              size="ssmm"
              variant="success"
            >
              <CheckSquare className="h-5 w-5" />
              Kiểm kê kho
            </Button>
          </Can>

          <Can permission="create_stock_transfers">
            <Button
              onClick={() => router.push(`/inventory/stock-transfer/create?warehouse=${warehouseId}`)}
              size="ssmm"
              variant="warning"
            >
              <Share2 className="h-5 w-5" />
              Chuyển kho
            </Button>
          </Can>

          <Can permission="update_warehouse">
            <Button
              onClick={() => router.push(`/warehouses/${warehouse.id}/edit`)}
              size="ssmm"
            >
              <Edit className="h-5 w-5" />
              Chỉnh sửa
            </Button>
          </Can>

          <Can permission="delete_warehouse">
            <Button
              onClick={handleDeleteClick}
              variant="danger"
              size="ssmm"
            >
              <Trash2 className="h-5 w-5" />
              Xóa
            </Button>
          </Can>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Products */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tổng số mặt hàng
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.inventory.totalProducts.toLocaleString()}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Total Quantity */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tổng số lượng
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.inventory.totalQuantity.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Khả dụng: {stats.inventory.availableQuantity.toLocaleString()}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Total Inventory Value */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Giá trị tồn kho
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.inventory.totalValue)}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Tổng giá trị hàng tồn
                </p>
              </div>
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                <DollarSign className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          {/* Transactions (30 days) */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Giao dịch (30 ngày)
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {Object.values(stats.transactions.last30Days).reduce(
                    (sum, count) => sum + count,
                    0
                  )}
                </p>
              </div>
              <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/30">
                <Activity className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Thông tin cơ bản
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Mã kho</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {warehouse.warehouseCode}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tên kho</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {warehouse.warehouseName}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Loại kho</dt>
                <dd className="mt-1">
                  <Badge color={getTypeBadgeColor(warehouse.warehouseType)}>
                    {getTypeLabel(warehouse.warehouseType)}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Trạng thái
                </dt>
                <dd className="mt-1">
                  <Badge color={warehouse.status === "active" ? "green" : "gray"}>
                    {warehouse.status === "active" ? "Hoạt động" : "Ngưng hoạt động"}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Sức chứa</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {warehouse.capacity ? `${warehouse.capacity.toLocaleString()} m³` : "—"}
                </dd>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Thông tin vị trí
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Địa chỉ</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {warehouse.address || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Thành phố</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {warehouse.city || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Khu vực</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {warehouse.region || "—"}
                </dd>
              </div>
            </div>
          </div>

          {/* Manager Information */}
          {warehouse.manager && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Quản lý kho
              </h2>
              <div className="flex items-start gap-4">
                {warehouse.manager.avatarUrl ? (
                  <img
                    src={warehouse.manager.avatarUrl}
                    alt={warehouse.manager.fullName}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <span className="text-xl font-semibold text-blue-600 dark:text-blue-300">
                      {warehouse.manager.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-blue-600 dark:text-blue-300">
                    <Link
                      href={`/users/${warehouse.manager.id}`}
                      className="hover:underline"
                    >
                      {warehouse.manager.fullName}
                    </Link>
                  </div>
                  <div className="mt-1 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                    <div>Mã NV: {warehouse.manager.employeeCode}</div>
                    {warehouse.manager.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {warehouse.manager.email}
                      </div>
                    )}
                    {warehouse.manager.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {warehouse.manager.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {warehouse.description && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Mô tả</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">{warehouse.description}</p>
            </div>
          )}

          {/* Current Inventory */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tồn kho hiện tại
              </h2>
              <Link
                href={`/inventory/warehouse/${warehouseId}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Xem tất cả →
              </Link>
            </div>
            <InventoryTableByWarehouse
              inventory={inventoryResponse || []}
              isLoading={inventoryLoading}
            />
          </div>

          {/* Recent Transactions */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Giao dịch gần đây
              </h2>
              <Link
                href={`/inventory/transactions?warehouse=${warehouseId}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Xem tất cả →
              </Link>
            </div>

            {transactionsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
              </div>
            ) : transactionsResponse && transactionsResponse.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Mã giao dịch
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Loại
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Ngày tạo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                    {transactionsResponse.map((transaction) => {
                      const statusInfo = getTransactionStatusInfo(transaction.status);
                      return (
                        <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            <Link
                              href={`/inventory/transactions/${transaction.id}`}
                              className="hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              {transaction.transactionCode}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {getTransactionTypeLabel(transaction.transactionType)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge color={statusInfo.color}>{statusInfo.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {new Date(transaction.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Chưa có giao dịch nào
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Charts & Quick Actions */}
        <div className="space-y-6">
          {/* Transaction Breakdown Chart */}
          {stats && Object.keys(stats.transactions.last30Days).length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Phân loại giao dịch (30 ngày)
              </h2>
              {statsLoading ? (
                <div className="flex h-[300px] items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                </div>
              ) : (
                <ReactApexChart
                  options={transactionChartData}
                  series={transactionChartData.series}
                  type="donut"
                  height={300}
                />
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Thông tin khác
            </h2>
            <div className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Ngày tạo</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {warehouse.createdAt
                    ? new Date(warehouse.createdAt).toLocaleString("vi-VN")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Cập nhật lần cuối
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {warehouse.updatedAt
                    ? new Date(warehouse.updatedAt).toLocaleString("vi-VN")
                    : "—"}
                </dd>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Thao tác nhanh
            </h2>
            <div className="space-y-2">
              <Link
                href={`/inventory/warehouse/${warehouseId}`}
                className="flex w-full items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <Package className="h-5 w-5" />
                Xem tồn kho
              </Link>
              <Link
                href={`/inventory/transactions/create/import?warehouse=${warehouseId}`}
                className="flex w-full items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <Download className="h-5 w-5" />
                Nhập kho
              </Link>
              <Link
                href={`/inventory/transactions/create/export?warehouse=${warehouseId}`}
                className="flex w-full items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <Upload className="h-5 w-5" />
                Xuất kho
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Xóa kho hàng"
        message={`Bạn có chắc chắn muốn xóa kho hàng "${response?.warehouseName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteWarehouse.isPending}
      />
    </div>
  );
}
