"use client";

import React from "react";
import Link from "next/link";
import { useRecentOrders } from "@/hooks/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import Badge from "@/components/ui/badge/Badge";
import {
  PAYMENT_STATUS_LABELS,
  ORDER_STATUS_LABELS,
} from "@/lib/constants";

const PAYMENT_STATUS_COLORS = {
  unpaid: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  partial: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const ORDER_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface RecentOrdersTableProps {
  initialData?: any[];
}

export function RecentOrdersTable({ initialData }: RecentOrdersTableProps) {
  const { data: fetchedOrders, isLoading } = useRecentOrders(10);
  const rawOrders = initialData || fetchedOrders;
  const orders = Array.isArray(rawOrders) ? rawOrders : rawOrders?.data || [];

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Đơn hàng gần đây
        </h3>
        <Link
          href="/sales/orders"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Xem tất cả →
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="whitespace-nowrap pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                Mã đơn
              </th>
              <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                Khách hàng
              </th>
              <th className="whitespace-nowrap pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                Ngày đặt
              </th>
              <th className="whitespace-nowrap pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                Tổng tiền
              </th>
              <th className="whitespace-nowrap pb-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                Thanh toán
              </th>
              <th className="whitespace-nowrap pb-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                Trạng thái
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3">
                    <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                  <td className="py-3">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                  <td className="py-3">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="ml-auto h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                  <td className="py-3">
                    <div className="mx-auto h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                  <td className="py-3">
                    <div className="mx-auto h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                </tr>
              ))
            ) : orders && orders.length > 0 ? (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                >
                   <td className="whitespace-nowrap py-3">
                     <Link
                       href={`/sales/orders/${order.id}`}
                       className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                     >
                       {order.orderCode}
                     </Link>
                   </td>
                   <td className="min-w-[150px] py-3 text-gray-900 dark:text-white">
                     <div className="truncate font-medium">{order.customer.customerName}</div>
                   </td>
                   <td className="whitespace-nowrap py-3 text-gray-600 dark:text-gray-400">
                     {formatDate(order.orderDate)}
                   </td>
                   <td className="whitespace-nowrap py-3 text-right font-medium text-gray-900 dark:text-white">
                     {formatCurrency(order.totalAmount)}
                   </td>
                   <td className="whitespace-nowrap py-3 text-center">
                     <span
                       className={cn(
                         "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                         PAYMENT_STATUS_COLORS[order.paymentStatus as keyof typeof PAYMENT_STATUS_COLORS] || PAYMENT_STATUS_COLORS.unpaid
                       )}
                     >
                       {PAYMENT_STATUS_LABELS[order.paymentStatus as keyof typeof PAYMENT_STATUS_COLORS] || order.paymentStatus}
                     </span>
                   </td>
                   <td className="whitespace-nowrap py-3 text-center">
                     <span
                       className={cn(
                         "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                         ORDER_STATUS_COLORS[order.orderStatus as keyof typeof ORDER_STATUS_COLORS] || ORDER_STATUS_COLORS.pending
                       )}
                     >
                       {ORDER_STATUS_LABELS[order.orderStatus as keyof typeof ORDER_STATUS_LABELS] || order.orderStatus}
                     </span>
                   </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                  Chưa có đơn hàng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
