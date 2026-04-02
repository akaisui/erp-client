"use client";

/**
 * Order Summary Component
 * Sticky sidebar hiển thị tổng tiền và payment info
 */

import React from "react";
import { OrderSummary as OrderSummaryType, PaymentMethod, Customer } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  SALES_CHANNELS,
  SALES_CHANNEL_LABELS,
} from "@/lib/constants";

interface OrderSummaryProps {
  summary: OrderSummaryType;
  paymentMethod?: PaymentMethod;
  paidAmount?: number;
  customer?: Customer | null;
  onPaymentMethodChange?: (method: PaymentMethod) => void;
  onPaidAmountChange?: (amount: number) => void;
  disabled?: boolean;
}

export default function OrderSummary({
  summary,
  paymentMethod,
  paidAmount = 0,
  customer,
  onPaymentMethodChange,
  onPaidAmountChange,
  disabled = false,
}: OrderSummaryProps) {
  const debtAmount = summary.total - paidAmount;
  const canUseCredit = customer && customer.creditLimit > 0;
  const availableCredit = customer
    ? Math.max(0, customer.creditLimit - customer.currentDebt)
    : 0;
  const willExceedLimit = customer && debtAmount > availableCredit;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <DollarSign className="h-5 w-5" />
          Tổng đơn hàng
        </h3>

        <div className="space-y-3">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Tổng tiền hàng</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(summary.subtotal)}
            </span>
          </div>

          {/* Discount */}
          {summary.discount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Giảm giá</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                -{formatCurrency(summary.discount)}
              </span>
            </div>
          )}

          {/* Tax */}
          {summary.tax > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Thuế</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(summary.tax)}
              </span>
            </div>
          )}

          {/* Shipping */}
          {summary.shipping > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Phí vận chuyển</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(summary.shipping)}
              </span>
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Tổng thanh toán
            </span>
            <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              {formatCurrency(summary.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      {onPaymentMethodChange && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Phương thức thanh toán
          </h3>

          <div className="space-y-2">
            {Object.values(PAYMENT_METHODS).map((method) => {
              const isCredit = method === "credit";
              const isDisabled = disabled || (isCredit && !canUseCredit);

              return (
                <label
                  key={method}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 ${
                    paymentMethod === method
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
                      : ""
                  } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={(e) => onPaymentMethodChange(e.target.value as PaymentMethod)}
                    disabled={isDisabled}
                    className="h-4 w-4 border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {PAYMENT_METHOD_LABELS[method]}
                  </span>
                </label>
              );
            })}
          </div>

          {!canUseCredit && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
              <p className="text-xs text-yellow-800 dark:text-yellow-300">
                Khách hàng chưa có hạn mức công nợ. Chỉ có thể thanh toán bằng tiền mặt hoặc
                chuyển khoản.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Paid Amount (for credit payment) */}
      {onPaidAmountChange && paymentMethod === "credit" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Thanh toán trước
          </h3>

          <div className="space-y-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Số tiền trả trước
              </label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => onPaidAmountChange(parseFloat(e.target.value) || 0)}
                min="0"
                max={summary.total}
                step="1000"
                disabled={disabled}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tổng đơn hàng</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(summary.total)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Trả trước</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {formatCurrency(paidAmount)}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">Công nợ</span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(debtAmount)}
                </span>
              </div>
            </div>

            {/* Credit Validation */}
            {customer && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Hạn mức hiện tại</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(customer.creditLimit)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Đã sử dụng</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(customer.currentDebt)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Còn lại</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(availableCredit)}
                  </span>
                </div>

                {willExceedLimit ? (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                        Vượt hạn mức công nợ
                      </p>
                      <p className="text-xs text-red-800 dark:text-red-300">
                        Cần trả trước thêm{" "}
                        {formatCurrency(debtAmount - availableCredit)} hoặc tăng hạn mức.
                      </p>
                    </div>
                  </div>
                ) : debtAmount > 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-2 dark:border-green-800 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <p className="text-xs text-green-900 dark:text-green-200">
                      Trong hạn mức công nợ
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
