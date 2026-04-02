"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCreatePromotion } from "@/hooks/api/usePromotions";
import PromotionForm from "@/components/promotions/PromotionForm";
import type { CreatePromotionDto } from "@/types";
import Button from "@/components/ui/button/Button";
import { ArrowLeft } from "lucide-react";

export default function CreatePromotionPage() {
  const router = useRouter();
  const createPromotion = useCreatePromotion();

  const handleSubmit = async (data: CreatePromotionDto) => {
    console.log("Đây")
    try {
      await createPromotion.mutateAsync(data);
      router.push("/promotions");
    } catch (error) {
      console.error("Failed to create promotion:", error);
    }
  };

  const handleCancel = () => {
    router.push("/promotions");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tạo Chương Trình Khuyến Mãi
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tạo chương trình khuyến mãi, giảm giá cho khách hàng
          </p>
        </div>
        <Button variant="outline" size="ssmm" onClick={() => router.push("/promotions")}>
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </Button>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <PromotionForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={createPromotion.isPending}
        />
      </div>

      {/* Guide */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300">
          Hướng dẫn tạo khuyến mãi
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-400">
          <li>
            • <strong>Giảm theo %:</strong> Giảm x% giá trị đơn hàng (có thể giới hạn số tiền giảm tối đa)
          </li>
          <li>
            • <strong>Giảm cố định:</strong> Giảm trừ một số tiền cố định cho đơn hàng
          </li>
          <li>
            • <strong>Mua X tặng Y:</strong> Mua số lượng X sản phẩm sẽ được tặng Y sản phẩm
          </li>
          <li>
            • <strong>Tặng quà:</strong> Tặng kèm sản phẩm khi mua hàng
          </li>
          <li>
            • Khuyến mãi cần được <strong>phê duyệt</strong> trước khi có hiệu lực
          </li>
          <li>
            • Có thể cấu hình điều kiện chi tiết (thời gian, nhóm khách hàng...) ở phần <strong>Điều kiện nâng cao</strong>
          </li>
          <li>
            • Giới hạn số lượng để tránh thua lỗ khi có quá nhiều đơn hàng áp dụng
          </li>
        </ul>
      </div>

      {/* Examples */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Ví dụ cấu hình
        </h3>
        <div className="mt-3 space-y-4">
          {/* Example 1 */}
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white">
              1. Flash Sale giảm 20%
            </h4>
            <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <p>• Loại: <strong>Giảm theo %</strong></p>
              <p>• Giá trị: <strong>20%</strong></p>
              <p>• Giảm tối đa: <strong>500,000đ</strong></p>
              <p>• Đơn tối thiểu: <strong>1,000,000đ</strong></p>
              <p>• Giới hạn: <strong>100 đơn đầu tiên</strong></p>
            </div>
          </div>

          {/* Example 2 */}
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white">
              2. Mua 2 tặng 1
            </h4>
            <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <p>• Loại: <strong>Mua X tặng Y</strong></p>
              <p>• Điều kiện JSON:</p>
              <pre className="mt-1 rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
                {`{
  "buyQuantity": 2,
  "getQuantity": 1
}`}
              </pre>
            </div>
          </div>

          {/* Example 3 */}
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white">
              3. Happy Hour (17h-19h giảm 15%)
            </h4>
            <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <p>• Loại: <strong>Giảm theo %</strong></p>
              <p>• Giá trị: <strong>15%</strong></p>
              <p>• Lặp lại: <strong>Có</strong></p>
              <p>• Điều kiện JSON:</p>
              <pre className="mt-1 rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">
                {`{
  "timeSlots": [
    { "start": "17:00", "end": "19:00" }
  ]
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}