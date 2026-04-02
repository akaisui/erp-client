"use client";

import React from "react";
import Link from "next/link";
import { useLowStockItems, useOverdueDebts } from "@/hooks/api";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import {
  AlertTriangle,
  Clock,
  TrendingDown,
  CheckCircle,
  Phone,
} from "lucide-react";

interface AlertsActionsSectionProps {
  initialLowStock?: any[];
  initialOverdueDebts?: any[];
}

export function AlertsActionsSection({
  initialLowStock,
  initialOverdueDebts,
}: AlertsActionsSectionProps) {
  const { data: lowStockItemsWrapper = [], isLoading: lowStockLoading } = useLowStockItems();
  const lowStockItems = lowStockItemsWrapper as any;
  const { data: overdueDebtsWrapper = [], isLoading: overdueLoading } = useOverdueDebts();
  const overdueDebts = overdueDebtsWrapper as any;

  // Use initial data if provided, otherwise use individual APIs
  const lowStockData = (initialLowStock || (Array.isArray(lowStockItems) ? lowStockItems : lowStockItems?.data?.alerts || [])) as any;
  const overdueDebtData = (initialOverdueDebts || (Array.isArray(overdueDebts) ? overdueDebts : overdueDebts || [])) as any;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left Column: Warehouse & Production Alerts */}
      <div className="space-y-4">
        {/* Low Stock Alert */}
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tồn kho thấp
            </h3>
            {lowStockItems && lowStockItems.length > 0 && (
              <span className="ml-auto inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {lowStockItems.length}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {lowStockLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
                  ></div>
                ))}
              </div>
            ) : lowStockData && lowStockData.length > 0 ? (
              <>
                {lowStockData.slice(0, 3).map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/50"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.product?.productName || item.product_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Tồn: {formatNumber(item.availableQuantity || item.current_stock)} (tối thiểu:{" "}
                        {formatNumber(item.product?.minStockLevel || item.min_stock)})
                      </p>
                    </div>
                    <button className="ml-2 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
                      Mua hàng
                    </button>
                  </div>
                ))}
                {lowStockData.length > 3 && (
                  <Link
                    href="/inventory/alerts"
                    className="block text-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Xem thêm {lowStockData.length - 3} cảnh báo →
                  </Link>
                )}
              </>
            ) : (
              <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                ✓ Tồn kho ổn định
              </p>
            )}
          </div>
        </div>

        {/* Expiry Warning */}
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sắp hết hạn
            </h3>
          </div>
          <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Không có sản phẩm sắp hết hạn
          </p>
        </div>

        {/* Overdue Production */}
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Lệnh SX trễ tiến độ
            </h3>
          </div>
          <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            ✓ Tất cả lệnh SX đúng tiến độ
          </p>
        </div>
      </div>

      {/* Right Column: Finance & Sales Actions */}
      <div className="space-y-4">
        {/* Pending Orders */}
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Đơn hàng cần duyệt
            </h3>
          </div>
          <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Không có đơn hàng chờ duyệt
          </p>
        </div>

        {/* Overdue Debts */}
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="mb-4 flex items-center gap-2">
            <Phone className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Công nợ quá hạn
            </h3>
            {overdueDebts && overdueDebts.length > 0 && (
              <span className="ml-auto inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {overdueDebts.length}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {overdueLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
                  ></div>
                ))}
              </div>
            ) : overdueDebtData && overdueDebtData.length > 0 ? (
              <>
                {overdueDebtData.slice(0, 3).map((debt: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/10"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {debt.customer_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Nợ: {formatCurrency(debt.total_debt)} • Quá hạn{" "}
                        {debt.days_overdue} ngày
                      </p>
                    </div>
                    <button className="ml-2 rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800">
                      Nhắc nợ
                    </button>
                  </div>
                ))}
                {overdueDebtData.length > 3 && (
                  <Link
                    href="/finance/debt-reconciliation"
                    className="block text-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Xem thêm {overdueDebtData.length - 3} khách hàng →
                  </Link>
                )}
              </>
            ) : (
              <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                ✓ Không có công nợ quá hạn
              </p>
            )}
          </div>
        </div>

        {/* Cash Fund */}
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quỹ tiền mặt hiện tại
            </h3>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              0 ₫
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Số dư hôm nay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
