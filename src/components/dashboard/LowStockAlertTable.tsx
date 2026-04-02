"use client";

import React from "react";
import Link from "next/link";
import { useLowStockItems } from "@/hooks/api";
import { formatNumber, cn } from "@/lib/utils";
import { AlertTriangle, PackageX } from "lucide-react";

interface LowStockAlertTableProps {
  initialData?: any[];
}

export function LowStockAlertTable({ initialData }: LowStockAlertTableProps) {
  const { data: response, isLoading } = useLowStockItems();
  const rawItems = initialData || response?.data;
  const items = Array.isArray(rawItems) ? rawItems : [];

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sản phẩm sắp hết hàng
          </h3>
        </div>
        <Link
          href="/inventory/stock-alerts"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Xem tất cả →
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                Sản phẩm
              </th>
              <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                SKU
              </th>
              <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                Kho
              </th>
              <th className="pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                Tồn kho
              </th>
              <th className="pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                Tồn tối thiểu
              </th>
              <th className="pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                Thiếu
              </th>
              <th className="pb-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
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
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                  <td className="py-3">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                  <td className="py-3">
                    <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="ml-auto h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="ml-auto h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="ml-auto h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                  <td className="py-3">
                    <div className="mx-auto h-6 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                </tr>
              ))
            ) : items && items.length > 0 ? (
              items.map((item) => {
                // Determine values based on whether data is from initialData (flat) or direct hook (nested)
                const productName = item.product?.productName || item.product_name;
                const sku = item.product?.sku || item.sku;
                const warehouseName = item.warehouse?.warehouseName || item.warehouse_name;
                
                const availableQuantity = item.availableQuantity ?? item.current_stock ?? 0;
                const minStockLevel = item.product?.minStockLevel ?? item.min_stock ?? 0;
                const productId = item.productId || item.product_id;
                
                // Calculate derived values
                const shortage = Math.max(0, minStockLevel - availableQuantity);
                const isOutOfStock = availableQuantity === 0;
                const stockPercentage = minStockLevel > 0 ? (availableQuantity / minStockLevel) * 100 : 0;

                return (
                  <tr
                    key={`${productId}-${item.warehouseId || item.warehouse_id}`}
                    className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-3">
                      <Link
                        href={`/inventory/products/${productId}`}
                        className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {productName}
                      </Link>
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      {sku}
                    </td>
                    <td className="py-3 text-gray-900 dark:text-white">
                      {warehouseName}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={cn(
                          "font-medium",
                          isOutOfStock
                            ? "text-red-600 dark:text-red-400"
                            : stockPercentage < 50
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-gray-900 dark:text-white"
                        )}
                      >
                        {formatNumber(availableQuantity)}
                      </span>
                    </td>
                    <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                      {formatNumber(minStockLevel)}
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {formatNumber(shortage)}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <PackageX className="h-3 w-3" />
                          Hết hàng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <AlertTriangle className="h-3 w-3" />
                          Sắp hết
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <PackageX className="h-12 w-12 text-gray-400" />
                    <p>Không có sản phẩm nào sắp hết hàng</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
