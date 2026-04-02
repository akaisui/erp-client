"use client";


import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useDeliveries, useDeliveryStatistics } from "@/hooks/api";
import { Can } from "@/components/auth";
import Button from "@/components/ui/button/Button";
import DeliveryStatus from "@/components/sales/DeliveryStatus";
import {
  ApiResponse,
  Delivery,
  DeliveryStatus as DeliveryStatusType,
  SettlementStatus,
} from "@/types";
import {
  Plus,
  Eye,
  Truck,
  Package,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Search,
  Filter,
  X,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

export default function DeliveriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<
    DeliveryStatusType | "all"
  >("all");
  const [settlementStatusFilter, setSettlementStatusFilter] = useState<
    SettlementStatus | "all"
  >("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Fetch Deliveries
  const { data, isLoading, error } = useDeliveries({
    deliveryStatus:
      deliveryStatusFilter !== "all" ? deliveryStatusFilter : undefined,
    settlementStatus:
      settlementStatusFilter !== "all" ? settlementStatusFilter : undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });
  const response = data as unknown as ApiResponse<Delivery[]>;

  // Fetch Statistics
  const { data: statsData } = useDeliveryStatistics({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });
  const statistics = statsData?.data;

  // Filter deliveries by search
  const deliveries = useMemo(() => {
    if (!response?.data) return [];

    return response.data.filter((delivery) => {
      const matchesSearch =
        (delivery.deliveryCode?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (delivery.order?.orderCode?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (delivery.deliveryStaff?.full_name?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        ) ||
        (delivery.order?.customer?.customerName?.toLowerCase() || "").includes(
          searchTerm.toLowerCase()
        );

      return matchesSearch;
    });
  }, [response?.data, searchTerm]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setDeliveryStatusFilter("all");
    setSettlementStatusFilter("all");
    setFromDate("");
    setToDate("");
  };

  const hasActiveFilters =
    searchTerm ||
    deliveryStatusFilter !== "all" ||
    settlementStatusFilter !== "all" ||
    fromDate ||
    toDate;

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <h3 className="font-semibold text-red-900 dark:text-red-300">
          Lỗi khi tải danh sách giao hàng
        </h3>
        <p className="mt-1 text-sm text-red-800 dark:text-red-400">
          {(error as any)?.message || "Đã có lỗi xảy ra"}
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
            Giao Hàng
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý và theo dõi giao hàng
          </p>
        </div>

        <Can permission="sales.create">
          <Link href="/sales/orders/create">
            <Button variant="primary" icon={Plus}>
              Tạo Đơn Hàng
            </Button>
          </Link>
        </Can>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Deliveries */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tổng giao hàng
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.totalDeliveries}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* In Transit */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Đang giao
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.inTransitDeliveries}
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/30">
                <Package className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Delivered */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Đã giao
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {statistics.deliveredDeliveries}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* COD Collection */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Thu COD
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(statistics.collectedCOD)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  / {formatCurrency(statistics.totalCOD)}
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Bộ lọc</h3>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="ml-auto text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <X className="inline h-4 w-4 mr-1" />
              Xóa bộ lọc
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Mã giao hàng, đơn hàng, NV..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Delivery Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Trạng thái giao hàng
            </label>
            <select
              value={deliveryStatusFilter}
              onChange={(e) =>
                setDeliveryStatusFilter(
                  e.target.value as DeliveryStatusType | "all"
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ giao</option>
              <option value="in_transit">Đang giao</option>
              <option value="delivered">Đã giao</option>
              <option value="failed">Thất bại</option>
              <option value="returned">Đã hoàn trả</option>
            </select>
          </div>

          {/* Settlement Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Quyết toán
            </label>
            <select
              value={settlementStatusFilter}
              onChange={(e) =>
                setSettlementStatusFilter(
                  e.target.value as SettlementStatus | "all"
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ quyết toán</option>
              <option value="settled">Đã quyết toán</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Từ ngày
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Đến ngày
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Mã giao hàng
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Đơn hàng
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Nhân viên
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Ngày giao
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  COD
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Đang tải...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : deliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Không có dữ liệu giao hàng
                    </p>
                  </td>
                </tr>
              ) : (
                deliveries.map((delivery) => (
                  <tr
                    key={delivery.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {/* Delivery Code */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/sales/deliveries/${delivery.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        {delivery.deliveryCode}
                      </Link>
                    </td>

                    {/* Order */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/sales/orders/${delivery.orderId}`}
                        className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400"
                      >
                        {delivery.order?.orderCode}
                      </Link>
                      {delivery.order?.customer && (
                        <p className="mt-1 text-xs text-gray-500">
                          {delivery.order.customer.customerName}
                        </p>
                      )}
                    </td>

                    {/* Delivery Staff */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {delivery.deliveryStaff?.full_name || "-"}
                      </p>
                    </td>

                    {/* Delivery Date */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(delivery.deliveryDate), "dd/MM/yyyy")}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <DeliveryStatus delivery={delivery} size="sm" />
                    </td>

                    {/* COD Amount */}
                    <td className="px-4 py-3 text-right">
                      {delivery.codAmount > 0 ? (
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(delivery.collectedAmount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            / {formatCurrency(delivery.codAmount)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/sales/deliveries/${delivery.id}`}>
                          <Button variant="ghost" size="sm" icon={Eye}>
                            Chi tiết
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
