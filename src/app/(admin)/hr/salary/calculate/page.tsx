"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Can } from "@/components/auth/Can";
import SalaryCalculator from "@/components/salary/SalaryCalculator";
import { ArrowLeft, ArrowLeftIcon } from "lucide-react";
import Button from "@/components/ui/button/Button";

export default function CalculateSalaryPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/hr/salary");
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Can
      permission="create_salary"
      fallback={
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-400">
              Bạn không có quyền tính lương. Vui lòng liên hệ quản trị viên.
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tính lương Nhân viên
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Tính toán lương tự động dựa trên chấm công và doanh số
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.back()}
            size="smm"
          >
            <ArrowLeft className="h-5 w-5" />
            Quay lại
          </Button>
        </div>

        {/* Calculator */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <SalaryCalculator
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Hướng dẫn tính lương
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li>
                <strong>Bước 1:</strong> Chọn nhân viên và tháng cần tính lương
              </li>
              <li>
                <strong>Bước 2:</strong> Nhập thông tin lương (lương cơ bản,
                phụ cấp, thưởng, tạm ứng)
              </li>
              <li>
                <strong>Bước 3:</strong> Xem trước kết quả và xác nhận
              </li>
              <li>
                <strong>Lưu ý:</strong> Lương làm thêm (overtime) được tính tự
                động từ dữ liệu chấm công
              </li>
              <li>
                <strong>Lưu ý:</strong> Hoa hồng (commission) được tính tự động
                từ doanh số bán hàng (nếu có)
              </li>
            </ul>
          </div>

          {/* Calculation Formula */}
          <div className="mt-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Công thức tính lương
            </h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <div className="font-mono bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                <strong>Tổng lương</strong> = Lương cơ bản + Phụ cấp + Lương OT
                + Thưởng + Hoa hồng - Khấu trừ - Tạm ứng
              </div>
              <div className="space-y-1">
                <p>
                  <strong>Lương OT:</strong> Tính từ số giờ làm thêm × Hệ số OT
                  (1.5)
                </p>
                <p>
                  <strong>Hoa hồng:</strong> Tính từ tổng doanh số × Tỷ lệ hoa
                  hồng (2%)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Can>
  );
}
