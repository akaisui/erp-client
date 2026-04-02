"use client";

/**
 * Payment Form Component
 * Form để thêm thanh toán cho đơn hàng
 */

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { processPaymentSchema, type ProcessPaymentInput } from "@/lib/validations";
import Button from "@/components/ui/button/Button";
import { DollarSign, X } from "lucide-react";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface PaymentFormProps {
  orderId: number;
  remainingAmount: number;
  onSubmit: (data: ProcessPaymentInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function PaymentForm({
  orderId,
  remainingAmount,
  onSubmit,
  onCancel,
  isLoading = false,
}: PaymentFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProcessPaymentInput>({
    resolver: zodResolver(processPaymentSchema),
    defaultValues: {
      amount: remainingAmount,
      paymentMethod: "cash",
      paymentDate: new Date().toISOString().split("T")[0],
    },
  });

  const watchAmount = watch("amount");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Thêm thanh toán
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Remaining Amount Info */}
      <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-900 dark:text-blue-300">
            Số tiền còn nợ
          </span>
          <span className="text-lg font-bold text-blue-900 dark:text-blue-200">
            {formatCurrency(remainingAmount)}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Số tiền thanh toán <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="number"
            {...register("amount", { valueAsNumber: true })}
            min="0"
            max={remainingAmount}
            step="1000"
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
        )}
        {watchAmount > remainingAmount && (
          <p className="mt-1 text-sm text-yellow-600">
            Số tiền vượt quá số tiền còn nợ
          </p>
        )}
      </div>

      {/* Payment Method */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Phương thức thanh toán <span className="text-red-500">*</span>
        </label>
        <select
          {...register("paymentMethod")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="cash">{PAYMENT_METHOD_LABELS.cash}</option>
          <option value="bank_transfer">{PAYMENT_METHOD_LABELS.bank_transfer}</option>
          <option value="cod">{PAYMENT_METHOD_LABELS.cod}</option>
        </select>
        {errors.paymentMethod && (
          <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
        )}
      </div>

      {/* Payment Date */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Ngày thanh toán
        </label>
        <input
          type="date"
          {...register("paymentDate")}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Ghi chú
        </label>
        <textarea
          {...register("notes")}
          rows={3}
          placeholder="Ghi chú về khoản thanh toán..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Hủy
        </Button>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? "Đang xử lý..." : "Thanh toán"}
        </Button>
      </div>
    </form>
  );
}
