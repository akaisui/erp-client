"use client";

import React from "react";
import { Product, TransactionItem, TransactionItemsProps } from "@/types";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionItemRow } from "./TransactionItemRow";
import { Decimal } from "decimal.js";

export function TransactionItems({
  items,
  products = [],
  onUpdateItem,
  onRemoveItem,
  type = "import",
  showPrice = true,
  showBatchNumber = false,
  showExpiryDate = false,
  showNotes = false,
  readonly = false,
}: TransactionItemsProps) {
  const getProduct = (item: TransactionItem): Product | undefined => {
    if (item.product) return item.product;
    if (item.productId && products.length > 0) {
      return products.find((p) => p.id === item.productId);
    }
    return undefined;
  };

  const totalValue = items.reduce((sum, item) => {
    const product = getProduct(item);
    let price = item.unitPrice || product?.purchasePrice || 0;
    if (type === "export") {
      price = item.unitPrice || product?.sellingPriceRetail || 0;
    }
    const priceDecimal = new Decimal(price);

    return sum.plus(priceDecimal.times(item.quantity));
  }, new Decimal(0));

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
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
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Chưa có sản phẩm nào. Vui lòng thêm sản phẩm vào danh sách.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <Table>
          <TableHeader>
            <TableRow>
              <th className="w-12 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Sản phẩm
              </th>
              <th className="w-32 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Số lượng
              </th>
              {showPrice && (
                <>
                  <th className="w-32 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Đơn giá
                  </th>
                  <th className="w-32 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Thành tiền
                  </th>
                </>
              )}
              {showExpiryDate && (
                <th className="w-40 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Hạn sử dụng
                </th>
              )}
              {showBatchNumber && (
                <th className="w-32 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Số lô
                </th>
              )}
              {showNotes && (
                <th className="w-48 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Ghi chú
                </th>
              )}
              {!readonly && (
                <th className="w-20 px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Thao tác
                </th>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => {
              const product = getProduct(item);
              return (
                <TransactionItemRow
                  key={`${item.productId}-${index}`}
                  item={item}
                  index={index}
                  product={product}
                  onUpdateItem={onUpdateItem}
                  onRemoveItem={onRemoveItem}
                  type={type}
                  showPrice={showPrice}
                  showBatchNumber={showBatchNumber}
                  showExpiryDate={showExpiryDate}
                  showNotes={showNotes}
                  readonly={readonly}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      {showPrice && (
        <div className="flex justify-end">
          <div className="w-80 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Tổng số lượng:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {items.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Tổng giá trị:
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {totalValue.toNumber().toLocaleString("vi-VN")} đ
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
