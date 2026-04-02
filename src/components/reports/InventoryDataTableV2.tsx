"use client";

import React, { useState } from "react";
import { ChevronDown, Eye, Download } from "lucide-react";
import Button from "@/components/ui/button/Button";

interface InventoryItem {
  productId: number;
  sku: string;
  productName: string;
  unit: string;
  imageUrl?: string;
  beginningQuantity: number;
  importQuantity: number;
  exportQuantity: number;
  endingQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  minStockLevel: number;
  unitPrice: number;
  totalValue: number;
  status: "safe" | "low" | "critical";
  categoryName?: string;
  warehouseName?: string;
}

interface InventoryDataTableV2Props {
  data: InventoryItem[];
  isLoading?: boolean;
  onViewDetails?: (productId: number) => void;
  onExport?: () => void;
  showStockFlow?: boolean;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

const statusConfig = {
  safe: {
    bg: "bg-green-50 dark:bg-green-900/20",
    text: "text-green-700 dark:text-green-400",
    badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    label: "An toàn",
  },
  low: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    text: "text-yellow-700 dark:text-yellow-400",
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    label: "Tồn kho thấp",
  },
  critical: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-400",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    label: "Cảnh báo",
  },
};

export default function InventoryDataTableV2({
  data,
  isLoading = false,
  onViewDetails,
  onExport,
  showStockFlow = true,
}: InventoryDataTableV2Props) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<string>("totalValue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700"
          />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu</p>
      </div>
    );
  }

  const toggleExpandRow = (productId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedRows(newExpanded);
  };

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    let aVal: any = a[sortBy as keyof InventoryItem];
    let bVal: any = b[sortBy as keyof InventoryItem];

    if (typeof aVal === "string") {
      return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortOrder === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {showStockFlow ? "Báo Cáo Nhập - Xuất - Tồn" : "Tình Hình Tồn Kho"}
        </h3>
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            startIcon={<Download className="h-4 w-4" />}
          >
            Xuất Excel
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50">
              <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                #
              </th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                Sản phẩm
              </th>
              <th className="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                ĐVT
              </th>

              {showStockFlow && (
                <>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                    Tồn Đầu Kỳ
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                    Nhập Trong Kỳ
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                    Xuất Trong Kỳ
                  </th>
                </>
              )}

              <th className="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                Tồn Cuối Kỳ
              </th>
              <th className="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                Trạng Thái
              </th>
              <th className="px-6 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                Giá Trị
              </th>
              <th className="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                Hành Động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.map((item, index) => {
              const isExpanded = expandedRows.has(item.productId);
              const status = statusConfig[item.status];

              return (
                <React.Fragment key={item.productId}>
                  {/* Main Row */}
                  <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${status.bg}`}>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="h-8 w-8 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.productName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.sku}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">
                      {item.unit}
                    </td>

                    {showStockFlow && (
                      <>
                        <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">
                          {formatNumber(item.beginningQuantity)}
                        </td>
                        <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-semibold">
                          +{formatNumber(item.importQuantity)}
                        </td>
                        <td className="px-6 py-4 text-center text-red-600 dark:text-red-400 font-semibold">
                          -{formatNumber(item.exportQuantity)}
                        </td>
                      </>
                    )}

                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatNumber(item.endingQuantity)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${status.badge}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.totalValue)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {onViewDetails && (
                          <button
                            onClick={() => onViewDetails(item.productId)}
                            className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-600"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleExpandRow(item.productId)}
                          className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-600"
                          title="Mở rộng"
                        >
                          <ChevronDown
                            className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Details Row */}
                  {isExpanded && (
                    <tr className={status.bg}>
                      <td colSpan={showStockFlow ? 10 : 7} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Tồn Hiện Tại
                            </p>
                            <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                              {formatNumber(item.endingQuantity)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Khả Dụng
                            </p>
                            <p className="mt-1 font-semibold text-green-600 dark:text-green-400">
                              {formatNumber(item.availableQuantity)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Đang Giữ
                            </p>
                            <p className="mt-1 font-semibold text-orange-600 dark:text-orange-400">
                              {formatNumber(item.reservedQuantity)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Định Mức Tối Thiểu
                            </p>
                            <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                              {formatNumber(item.minStockLevel)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Đơn Giá
                            </p>
                            <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(item.unitPrice)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Danh Mục
                            </p>
                            <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                              {item.categoryName || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Stats */}
      <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tổng Sản Phẩm</p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
              {formatNumber(data.length)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tổng Giá Trị</p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(data.reduce((sum, item) => sum + item.totalValue, 0))}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Cảnh Báo</p>
            <p className="mt-1 text-lg font-bold text-yellow-600 dark:text-yellow-400">
              {data.filter((item) => item.status === "low").length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Hết Hàng</p>
            <p className="mt-1 text-lg font-bold text-red-600 dark:text-red-400">
              {data.filter((item) => item.status === "critical").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
