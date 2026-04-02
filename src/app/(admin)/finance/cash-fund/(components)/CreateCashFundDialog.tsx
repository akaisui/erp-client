"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/modal";
import { useCreateCashFund } from "@/hooks/api/useCashFund";
import { SimpleDatePicker } from "@/components/form/SimpleDatePicker";
import { toast } from "react-hot-toast";
import { RefreshCw } from "lucide-react";

const createCashFundSchema = z.object({
  fundDate: z.string().min(1, "Vui lòng chọn ngày quỹ"),
  openingBalance: z.number().min(0, "Số dư đầu kỳ không được âm"),
  notes: z.string().optional(),
});

type CreateCashFundForm = z.infer<typeof createCashFundSchema>;

interface CreateCashFundDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCashFundDialog({
  isOpen,
  onClose,
}: CreateCashFundDialogProps) {
  const createCashFund = useCreateCashFund();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateCashFundForm>({
    resolver: zodResolver(createCashFundSchema),
    defaultValues: {
      openingBalance: 0,
      notes: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        fundDate: "",
        openingBalance: 0,
        notes: "",
      });
    }
  }, [isOpen, reset]);

  const handleDateChange = (date: string) => {
    setValue("fundDate", date, { shouldValidate: true });
  };

  const onSubmit = async (data: CreateCashFundForm) => {
    try {
      await createCashFund.mutateAsync(data);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const fundDate = watch("fundDate");
  const isLoading = createCashFund.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-xl p-0 overflow-hidden rounded-xl flex flex-col max-h-[90vh]"
      showCloseButton={true}
    >
      {/* Header - Match UserDialog style */}
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Tạo quỹ tiền mặt mới
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Lập quỹ tiền mặt mới cho một ngày làm việc
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
        <form id="create-cash-fund-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Fund Date */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ngày quỹ <span className="text-red-500">*</span>
              </label>
              <SimpleDatePicker
                value={fundDate}
                onChange={handleDateChange}
                placeholder="Chọn ngày quỹ"
              />
              {errors.fundDate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.fundDate.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Chọn ngày để tạo quỹ tiền mặt
              </p>
            </div>

            {/* Opening Balance */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Số dư đầu kỳ (VND)
              </label>
              <input
                type="number"
                {...register("openingBalance", { valueAsNumber: true })}
                placeholder="0"
                min="0"
                step="1000"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {errors.openingBalance && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.openingBalance.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Số dư tiền mặt đầu ngày (lấy từ số dư cuối ngày trước)
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                {...register("notes")}
                placeholder="Nhập ghi chú..."
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="text-sm text-blue-900 dark:text-blue-300">
                <strong>Ghi chú:</strong> Hệ thống sẽ tự động lập phiếu thu/chi cho
                ngày này khi bạn lập thêm phiếu. Số dư cuối kỳ sẽ được tính toán
                từ: Số dư đầu + Tổng thu - Tổng chi
              </p>
            </div>
          </div>
        </form>
      </div>

      {/* Footer - Match UserDialog style */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Hủy
        </button>
        <button
          type="submit"
          form="create-cash-fund-form"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
          Tạo quỹ
        </button>
      </div>
    </Modal>
  );
}
