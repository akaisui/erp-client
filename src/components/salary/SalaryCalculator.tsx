"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  calculateSalarySchema,
  CalculateSalaryFormValues,
} from "@/lib/validations/salary.schema";
import { useCalculateSalary } from "@/hooks/api/useSalary";
import { useUsers } from "@/hooks/api/useUsers";
import { SalaryBreakdown } from "./SalaryStatus";
import { dateToMonth, formatMonth } from "@/types/salary.types";
import type { SalaryCalculationResult } from "@/types/salary.types";
import {
  User,
  Calendar,
  DollarSign,
  Calculator,
  CheckCircle,
} from "lucide-react";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { MonthPicker } from "@/components/form/MonthPicker";
import { User as UserType } from "@/types";

export interface SalaryCalculatorProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

type CalculatorStep = "select" | "input" | "preview";

export default function SalaryCalculator({
  onSuccess,
  onCancel,
  className = "",
}: SalaryCalculatorProps) {
  const [step, setStep] = useState<CalculatorStep>("select");
  const [preview, setPreview] = useState<SalaryCalculationResult | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<CalculateSalaryFormValues>({
    resolver: zodResolver(calculateSalarySchema),
    defaultValues: {
      month: dateToMonth(new Date()),
    },
  });

  const calculateMutation = useCalculateSalary();
  const { data: usersData } = useUsers({ limit: 1000 }); 

  const users = usersData?.data as unknown as UserType[] || [];

  const selectedUserId = watch("userId");
  const selectedMonth = watch("month");

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId),
    [users, selectedUserId]
  );

  // Calculate total for preview
  const calculateTotal = (data: CalculateSalaryFormValues) => {
    const basic = data.basicSalary || 0;
    const allowance = data.allowance || 0;
    const bonus = data.bonus || 0;
    const advance = data.advance || 0;

    // Note: overtime and commission will be auto-calculated by backend
    return basic + allowance + bonus - advance;
  };

  const handleCalculate = async (data: CalculateSalaryFormValues) => {
    try {
      const result = await calculateMutation.mutateAsync(data);
      setPreview(result.data.data);
      setStep("preview");
    } catch (error) {}
  };

  const handleConfirm = () => {
    onSuccess?.();
  };

  const handleBack = () => {
    if (step === "preview") {
      setStep("input");
      setPreview(null);
    } else if (step === "input") {
      setStep("select");
    }
  };

  return (
    <div className={`${className}`}>
      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <Step
            number={1}
            title="Chọn nhân viên"
            active={step === "select"}
            completed={step === "input" || step === "preview"}
          />
          <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-2" />
          <Step
            number={2}
            title="Nhập thông tin"
            active={step === "input"}
            completed={step === "preview"}
          />
          <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-2" />
          <Step number={3} title="Xem trước" active={step === "preview"} />
        </div>
      </div>

      <form onSubmit={handleSubmit(handleCalculate)}>
        {/* Step 1: Select Employee & Month */}
        {step === "select" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Chọn nhân viên và tháng
            </h3>

            {/* User Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Nhân viên <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name="userId"
                render={({ field }) => (
                  <SearchableSelect
                    {...field}
                    options={users.map((user) => ({
                      value: user.id,
                      label: `${user.fullName} - ${user.employeeCode}`,
                    }))}
                    placeholder="-- Chọn nhân viên --"
                  />
                )}
              />
              {errors.userId && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.userId.message}
                </p>
              )}
            </div>

            {/* Month Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Tháng <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name="month"
                render={({ field }) => (
                  <MonthPicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.month && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.month.message}
                </p>
              )}
            </div>

            {/* Selected Info */}
            {selectedUser && selectedMonth && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  <strong>Nhân viên:</strong> {selectedUser.fullName}
                  <br />
                  <strong>Mã NV:</strong> {selectedUser.employeeCode}
                  <br />
                  <strong>Tháng:</strong> {formatMonth(selectedMonth)}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep("input")}
                disabled={!selectedUserId || !selectedMonth}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tiếp theo
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Hủy
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Input Salary Components */}
        {step === "input" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Nhập thông tin lương
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Lương cơ bản
                </label>
                <input
                  type="number"
                  step="1000"
                  {...register("basicSalary", { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                {errors.basicSalary && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.basicSalary.message}
                  </p>
                )}
              </div>

              {/* Allowance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phụ cấp
                </label>
                <input
                  type="number"
                  step="1000"
                  {...register("allowance", { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                {errors.allowance && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.allowance.message}
                  </p>
                )}
              </div>

              {/* Bonus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thưởng
                </label>
                <input
                  type="number"
                  step="1000"
                  {...register("bonus", { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                {errors.bonus && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.bonus.message}
                  </p>
                )}
              </div>

              {/* Advance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tạm ứng
                </label>
                <input
                  type="number"
                  step="1000"
                  {...register("advance", { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                {errors.advance && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.advance.message}
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ghi chú
              </label>
              <textarea
                {...register("notes")}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ghi chú (không bắt buộc)"
              />
              {errors.notes && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.notes.message}
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                <strong>Lưu ý:</strong> Lương làm thêm và hoa hồng sẽ được tính
                tự động dựa trên dữ liệu chấm công và doanh số bán hàng.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={calculateMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {calculateMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang tính toán...
                  </>
                ) : (
                  <>
                    <Calculator className="w-5 h-5" />
                    Tính lương
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && preview && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Xem trước kết quả
            </h3>

            {/* Employee Info */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Thông tin nhân viên
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Họ tên:
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {preview.user?.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Mã NV:
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {preview.user?.employeeCode}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Tháng:
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {formatMonth(preview.month)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Ngày công:
                  </span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {preview.workDays} ngày
                  </span>
                </div>
                {preview.overtimeHours > 0 && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Giờ OT:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {preview.overtimeHours} giờ
                    </span>
                  </div>
                )}
                {preview.totalSales && preview.totalSales > 0 && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      Doanh số:
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {preview.totalSales.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Salary Breakdown */}
            <SalaryBreakdown
              basicSalary={preview.basicSalary}
              allowance={preview.allowance}
              overtimePay={preview.overtimePay}
              bonus={preview.bonus}
              commission={preview.commission}
              deduction={preview.deduction}
              advance={preview.advance}
              totalSalary={preview.totalSalary}
            />

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Xác nhận
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

//----------------------------------------------
// Step Component (Internal)
//----------------------------------------------

interface StepProps {
  number: number;
  title: string;
  active?: boolean;
  completed?: boolean;
}

function Step({ number, title, active, completed }: StepProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
          completed
            ? "bg-green-600 text-white"
            : active
            ? "bg-blue-600 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
        }`}
      >
        {completed ? <CheckCircle className="w-6 h-6" /> : number}
      </div>
      <span
        className={`text-xs font-medium ${
          active || completed
            ? "text-gray-900 dark:text-gray-100"
            : "text-gray-500 dark:text-gray-400"
        }`}
      >
        {title}
      </span>
    </div>
  );
}
