"use client";

import React, { memo } from "react";
import { Product, TransactionItem } from "@/types";
import { TableCell, TableRow } from "@/components/ui/table";
import { Decimal } from "decimal.js";

interface TransactionItemRowProps {
  item: TransactionItem;
  index: number;
  product?: Product;
  onUpdateItem: (index: number, updates: any) => void;
  onRemoveItem: (index: number) => void;
  type?: string;
  showPrice?: boolean;
  showBatchNumber?: boolean;
  showExpiryDate?: boolean;
  showNotes?: boolean;
  readonly?: boolean;
}

// Memoize để tránh re-render khi parent update
export const TransactionItemRow = memo(function TransactionItemRow({
  item,
  index,
  product,
  onUpdateItem,
  onRemoveItem,
  type = "import",
  showPrice = true,
  showBatchNumber = false,
  showExpiryDate = false,
  showNotes = false,
  readonly = false,
}: TransactionItemRowProps) {
  // Format date for input
  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  let price = item.unitPrice || product?.purchasePrice || 0;
  if (type === 'export' || type === 'disposal') {
    price = item.unitPrice || product?.sellingPriceRetail || 0;
  }
  const priceDecimal = new Decimal(price);
  const total = priceDecimal.times(item.quantity);

  return (
    <TableRow>
      {/* Index */}
      <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
        {index + 1}
      </TableCell>

      {/* Product */}
      <TableCell className="px-4 py-3">
        {product ? (
          <div className="flex items-center gap-3">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0].imageUrl}
                alt={product.productName}
                className="h-10 w-10 rounded object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
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
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            )}
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {product.productName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {product.sku}
                {product.unit && ` • ${product.unit}`}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Sản phẩm không tồn tại
          </div>
        )}
      </TableCell>

      {/* Quantity */}
      <TableCell className="px-4 py-3">
        {readonly ? (
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {item.quantity.toLocaleString()}
          </span>
        ) : (
          <input
            type="number"
            min="1"
            step="1"
            value={item.quantity}
            onChange={(e) =>
              onUpdateItem(index, {
                quantity: parseFloat(e.target.value) || 1,
              })
            }
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        )}
      </TableCell>

      {/* Unit Price */}
      {showPrice && (
        <TableCell className="px-4 py-3 text-right">
          {readonly ? (
            <span className="text-sm text-gray-900 dark:text-white">
              {price.toLocaleString("vi-VN")}
            </span>
          ) : (
            <input
              type="number"
              min="0"
              step="10"
              value={priceDecimal.toNumber()}
              onChange={(e) =>
                onUpdateItem(index, {
                  unitPrice: new Decimal(e.target.value).toNumber() || 0,
                })
              }
              className="w-28 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          )}
        </TableCell>
      )}

      {/* Total */}
      {showPrice && (
        <TableCell className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
          {total.toNumber().toLocaleString("vi-VN")}
        </TableCell>
      )}

      {/* Expiry Date */}
      {showExpiryDate && (
        <TableCell className="px-4 py-3">
          {readonly ? (
            <span className="text-sm text-gray-900 dark:text-white">
              {item.expiryDate
                ? new Date(item.expiryDate).toLocaleDateString("vi-VN")
                : "—"}
            </span>
          ) : (
            <div className="relative w-40 flex items-center gap-2">
              <input
                ref={(input) => {
                  if (input) input.type = 'date';
                }}
                type="date"
                value={formatDateForInput(item.expiryDate)}
                onChange={(e) =>
                  onUpdateItem(index, {
                    expiryDate: e.target.value,
                  })
                }
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="block flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white cursor-pointer"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  input?.showPicker?.();
                }}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Chọn ngày"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          )}
        </TableCell>
      )}

      {/* Batch Number */}
      {showBatchNumber && (
        <TableCell className="px-4 py-3">
          {readonly ? (
            <span className="text-sm text-gray-900 dark:text-white">
              {item.batchNumber || "—"}
            </span>
          ) : (
            <input
              type="text"
              value={item.batchNumber || ""}
              onChange={(e) =>
                onUpdateItem(index, {
                  batchNumber: e.target.value,
                })
              }
              placeholder="Tùy chọn"
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
            />
          )}
        </TableCell>
      )}

      {/* Notes */}
      {showNotes && (
        <TableCell className="px-4 py-3">
          {readonly ? (
            <span className="text-sm text-gray-900 dark:text-white">
              {item.notes || "—"}
            </span>
          ) : (
            <textarea
              value={item.notes || ""}
              onChange={(e) =>
                onUpdateItem(index, {
                  notes: e.target.value,
                })
              }
              placeholder="Ghi chú..."
              rows={2}
              className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 resize-none"
            />
          )}
        </TableCell>
      )}

      {/* Actions */}
      {!readonly && (
        <TableCell className="px-4 py-3 text-center">
          <button
            type="button"
            onClick={() => onRemoveItem(index)}
            className="inline-flex items-center justify-center rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            title="Xóa"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </TableCell>
      )}
    </TableRow>
  );
});

TransactionItemRow.displayName = "TransactionItemRow";
