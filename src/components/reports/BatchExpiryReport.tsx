"use client";

import React, { useState } from "react";
import { AlertCircle, Clock, Trash2 } from "lucide-react";
import Button from "@/components/ui/button/Button";

interface BatchExpiryItem {
  productId: number;
  productName: string;
  sku: string;
  batchNumber: string;
  expiryDate: string;
  warehouse: string;
  daysRemaining: number;
  quantity: number;
  status: "ok" | "expiring" | "expired";
}

interface BatchExpiryReportProps {
  data: BatchExpiryItem[];
  isLoading?: boolean;
  onExport?: (format: "excel" | "pdf") => void;
}

const statusConfig = {
  ok: {
    bg: "bg-green-50 dark:bg-green-900/20",
    badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    icon: "🟢",
    label: "An toàn",
  },
  expiring: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    icon: "🟡",
    label: "Sắp hết hạn",
  },
  expired: {
    bg: "bg-red-50 dark:bg-red-900/20",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    icon: "🔴",
    label: "Đã hết hạn",
  },
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

export default function BatchExpiryReport({
  data,
  isLoading = false,
  onExport,
}: BatchExpiryReportProps) {
  const [sortBy, setSortBy] = useState<"daysRemaining" | "expiryDate">("daysRemaining");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700"
          />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <Clock className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          Không có lô hàng hoặc hết hạn được tìm thấy
        </p>
      </div>
    );
  }

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    if (sortBy === "daysRemaining") {
      return a.daysRemaining - b.daysRemaining;
    }
    return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
  });

  // Statistics
  const stats = {
    total: data.length,
    ok: data.filter((item) => item.status === "ok").length,
    expiring: data.filter((item) => item.status === "expiring").length,
    expired: data.filter((item) => item.status === "expired").length,
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex flex-col justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700 md:flex-row md:items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Báo Cáo Hạn Sử Dụng Lô Hàng
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý lô hàng theo nguyên lý FEFO (First Expired First Out)
          </p>
        </div>
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport("excel")}
            className="mt-4 md:mt-0"
          >
            Xuất Excel
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-700 md:grid-cols-4">
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
          <p className="text-xs text-gray-600 dark:text-gray-400">Tổng Lô</p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
            {formatNumber(stats.total)}
          </p>
        </div>
        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
          <p className="text-xs text-green-600 dark:text-green-400">An Toàn</p>
          <p className="mt-1 text-lg font-bold text-green-700 dark:text-green-300">
            {formatNumber(stats.ok)}
          </p>
        </div>
        <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
          <p className="text-xs text-yellow-600 dark:text-yellow-400">Sắp Hết Hạn</p>
          <p className="mt-1 text-lg font-bold text-yellow-700 dark:text-yellow-300">
            {formatNumber(stats.expiring)}
          </p>
        </div>
        <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
          <p className="text-xs text-red-600 dark:text-red-400">Đã Hết Hạn</p>
          <p className="mt-1 text-lg font-bold text-red-700 dark:text-red-300">
            {formatNumber(stats.expired)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50">
              <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                Sản Phẩm
              </th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                Lô Hàng
              </th>
              <th className="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                Hạn Sử Dụng
              </th>
              <th className="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                Ngày Còn Lại
              </th>
              <th className="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                Số Lượng
              </th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                Kho
              </th>
              <th className="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                Trạng Thái
              </th>
              <th className="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                Hành Động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.map((item) => {
              const status = statusConfig[item.status];
              const urgency =
                item.status === "expired"
                  ? "priority-critical"
                  : item.status === "expiring"
                    ? "priority-high"
                    : "priority-normal";

              return (
                <tr
                  key={`${item.productId}-${item.batchNumber}`}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${status.bg}`}
                >
                  {/* Product Info */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.sku}
                      </p>
                    </div>
                  </td>

                  {/* Batch Number */}
                  <td className="px-6 py-4">
                    <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-900 dark:bg-gray-700 dark:text-white">
                      {item.batchNumber}
                    </code>
                  </td>

                  {/* Expiry Date */}
                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatDate(item.expiryDate)}
                    </span>
                  </td>

                  {/* Days Remaining */}
                  <td className="px-6 py-4 text-center">
                    <div
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold ${
                        item.status === "expired"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : item.status === "expiring"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {item.daysRemaining < 0
                        ? `Quá hạn ${Math.abs(item.daysRemaining)}d`
                        : `${item.daysRemaining}d`}
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="px-6 py-4 text-center font-semibold text-gray-900 dark:text-white">
                    {formatNumber(item.quantity)}
                  </td>

                  {/* Warehouse */}
                  <td className="px-6 py-4">
                    <span className="text-gray-700 dark:text-gray-300">
                      {item.warehouse}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${status.badge}`}>
                      {status.icon} {status.label}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-center">
                    {item.status === "expired" && (
                      <button className="rounded p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20">
                        <Trash2 className="h-4 w-4" title="Xuất hủy" />
                      </button>
                    )}
                    {item.status === "expiring" && (
                      <button className="rounded p-1 text-yellow-600 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900/20">
                        <AlertCircle className="h-4 w-4" title="Ưu tiên xuất" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      {stats.expired > 0 && (
        <div className="border-t border-red-200 bg-red-50 px-6 py-4 dark:border-red-900/30 dark:bg-red-900/20">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-semibold text-red-900 dark:text-red-300">
                ⚠️ Có {stats.expired} lô hàng đã hết hạn
              </p>
              <p className="mt-1 text-sm text-red-800 dark:text-red-400">
                Vui lòng lập phiếu xuất hủy để xóa khỏi hệ thống
              </p>
            </div>
          </div>
        </div>
      )}

      {stats.expiring > 0 && stats.expired === 0 && (
        <div className="border-t border-yellow-200 bg-yellow-50 px-6 py-4 dark:border-yellow-900/30 dark:bg-yellow-900/20">
          <div className="flex gap-3">
            <Clock className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-300">
                ⏰ Có {stats.expiring} lô hàng sắp hết hạn (≤7 ngày)
              </p>
              <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-400">
                Ưu tiên xuất khẩu theo nguyên lý FEFO
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
