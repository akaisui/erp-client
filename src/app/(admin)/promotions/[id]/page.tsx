"use client";

/**
 * Edit Promotion Page
 * Cập nhật chương trình khuyến mãi
 */

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  usePromotion,
  useUpdatePromotion,
} from "@/hooks/api/usePromotions";
import PromotionForm from "@/components/promotions/PromotionForm";
import type { UpdatePromotionDto } from "@/types";
import { ArrowLeft } from "lucide-react";

export default function EditPromotionPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);

  const { data, isLoading } = usePromotion(id);
  const updatePromotion = useUpdatePromotion();

  const promotion = data?.data;

  const handleSubmit = async (formData: any) => {
    try {
      const updateData: UpdatePromotionDto = {
        promotionName: formData.promotionName,
        discountValue: formData.discountValue,
        maxDiscountValue: formData.maxDiscountValue,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isRecurring: formData.isRecurring,
        applicableTo: formData.applicableTo,
        minOrderValue: formData.minOrderValue,
        minQuantity: formData.minQuantity,
        quantityLimit: formData.quantityLimit,
        conditions: formData.conditions,
        products: formData.products,
      };

      await updatePromotion.mutateAsync({ id, data: updateData });
      router.push("/promotions");
    } catch (error) {
      console.error("Failed to update promotion:", error);
    }
  };

  const handleCancel = () => {
    router.push("/promotions");
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <p className="text-gray-500">Không tìm thấy chương trình khuyến mãi</p>
        <Link href="/promotions" className="mt-4 text-blue-600">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (promotion.status !== "pending") {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <p className="text-red-500">
          Chỉ có thể sửa khuyến mãi ở trạng thái "Chờ duyệt"
        </p>
        <Link href="/promotions" className="mt-4 text-blue-600">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/promotions"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cập Nhật Khuyến Mãi
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {promotion.promotionCode} - {promotion.promotionName}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <PromotionForm
            initialData={{
              promotionCode: promotion.promotionCode,
              promotionName: promotion.promotionName,
              promotionType: promotion.promotionType,
              discountValue: promotion.discountValue,
              maxDiscountValue: promotion.maxDiscountValue,
              startDate: promotion.startDate,
              endDate: promotion.endDate,
              isRecurring: promotion.isRecurring,
              applicableTo: promotion.applicableTo,
              minOrderValue: promotion.minOrderValue,
              minQuantity: promotion.minQuantity,
              quantityLimit: promotion.quantityLimit,
              conditions: promotion.conditions,
              products: promotion.products?.map((p: any) => ({
                productId: p.productId,
                discountValueOverride: p.discountValueOverride,
                minQuantity: p.minQuantity,
                giftProductId: p.giftProductId,
                giftQuantity: p.giftQuantity,
                note: p.note,
              })),
            }}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={updatePromotion.isPending}
          />
        </div>
      </div>

      {/* Warning */}
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-300">
            Lưu ý khi cập nhật
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-yellow-800 dark:text-yellow-400">
            <li>• Không thể thay đổi mã khuyến mãi và loại khuyến mãi</li>
            <li>• Chỉ có thể sửa khi khuyến mãi ở trạng thái "Chờ duyệt"</li>
            <li>
              • Sau khi phê duyệt, nếu cần thay đổi hãy hủy và tạo khuyến mãi mới
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}