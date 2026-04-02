"use client";

import React from "react";
import Link from "next/link";
import { Inventory, InventoryByProductResponse } from "@/types";
import { StockLevelIndicator, StockStatusBadge } from "./StockLevelIndicator";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

interface InventoryTableProps {
  inventory: InventoryByProductResponse;
  isLoading?: boolean;
  showWarehouse?: boolean;
  onAdjust?: (item: Inventory) => void;
  onTransfer?: (item: Inventory) => void;
}

export function InventoryTable({
  inventory,
  isLoading = false,
  showWarehouse = true,
  onAdjust,
  onTransfer,
}: InventoryTableProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (!inventory.warehouses || inventory.warehouses.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <svg
          className="mb-4 h-12 w-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="text-sm">Không có dữ liệu tồn kho</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Sản phẩm
          </th>
          {showWarehouse && (
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Kho
            </th>
          )}
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Tồn kho
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Đặt giữ
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Khả dụng
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Mức độ
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Trạng thái
          </th>
          {onAdjust && (
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Thao tác
            </th>
          )}
          {onTransfer && (
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Chuyển kho
            </th>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {inventory.warehouses.map((item) => {
          const availableQty = Number(item.quantity) - Number(item.reservedQuantity);
          const minStockLevel = Number(inventory.product?.minStockLevel) || 0;

          return (
            <TableRow key={`${item.warehouseId}-${item.productId}`}>
              {/* Product */}
              <TableCell className="px-6 py-4">
                <div>
                  <Link
                    href={`/products/${item.productId}`}
                    className="font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                  >
                    {inventory.product?.productName || "N/A"}
                  </Link>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {inventory.product?.sku || "N/A"}
                  </div>
                </div>
              </TableCell>

              {/* Warehouse */}
              {showWarehouse && (
                <TableCell className="px-6 py-4">
                  <Link
                    href={`/warehouses/${item.warehouseId}`}
                    className="text-sm text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                  >
                    {item.warehouse?.warehouseName || "N/A"}
                  </Link>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <Badge
                      color={
                        item.warehouse?.warehouseType === "raw_material"
                          ? "blue"
                          : item.warehouse?.warehouseType === "packaging"
                          ? "yellow"
                          : item.warehouse?.warehouseType === "finished_product"
                          ? "green"
                          : "purple"
                      }
                    >
                      {item.warehouse?.warehouseType === "raw_material"
                        ? "Nguyên liệu"
                        : item.warehouse?.warehouseType === "packaging"
                        ? "Bao bì"
                        : item.warehouse?.warehouseType === "finished_product"
                        ? "Thành phẩm"
                        : "Hàng hóa"}
                    </Badge>
                  </div>
                </TableCell>
              )}

              {/* Quantity */}
              <TableCell className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                {item.quantity.toLocaleString()}
              </TableCell>

              {/* Reserved Quantity */}
              <TableCell className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                {Number(item.reservedQuantity) > 0 ? (
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    {item.reservedQuantity.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </TableCell>

              {/* Available Quantity */}
              <TableCell className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
                {availableQty.toLocaleString()}
              </TableCell>

              {/* Stock Level */}
              <TableCell className="px-6 py-4">
                <StockLevelIndicator
                  current={Number(item.quantity)}
                  min={minStockLevel}
                  reserved={Number(item.reservedQuantity)}
                  size="sm"
                  showLabel={false}
                />
              </TableCell>

              {/* Status */}
              <TableCell className="px-6 py-4">
                <StockStatusBadge
                  current={availableQty}
                  min={minStockLevel}
                />
              </TableCell>

              {/* Actions */}
              {onAdjust && (
                <TableCell className="px-6 py-4 text-right">
                  <button
                    onClick={() => onAdjust(item)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Điều chỉnh
                  </button>
                </TableCell>
              )}

              {/* Transfer Action */}
              {onTransfer && (
                <TableCell className="px-6 py-4 text-right">
                  <button
                    onClick={() => onTransfer(item)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Chuyển
                  </button>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
