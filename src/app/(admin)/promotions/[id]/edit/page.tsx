"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { usePromotion, useUpdatePromotion } from "@/hooks/api/usePromotions";
import PromotionForm from "@/components/promotions/PromotionForm";
import type { CreatePromotionFormData } from "@/lib/validations/promotion.schema";
import type { UpdatePromotionDto, Promotion } from "@/types/promotion.types";
import type { ApiResponse } from "@/types/common.types"; // ⚠️ Đảm bảo import ApiResponse

export default function EditPromotionPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);

  // Hooks
  // Đặt tên biến là dataWrapper cho giống tư duy trang danh sách
  const { data: dataWrapper, isLoading } = usePromotion(id);
  const updatePromotion = useUpdatePromotion();

  // ✅ FIX: Áp dụng cách ép kiểu giống hệt trang danh sách
  // dataWrapper chính là { success: true, data: Promotion, ... }
  const promotion = (dataWrapper as unknown as ApiResponse<Promotion>)?.data;

  // --- HANDLERS ---

  const handleSubmit = async (formData: CreatePromotionFormData) => {
    try {
      const payload = {
        ...formData,
        products: formData.products?.map((p) => ({
          ...p,
          giftProductId: p.giftProductId || undefined,
          discountValueOverride: p.discountValueOverride || undefined,
          note: p.note || undefined,
        })),
      };

      await updatePromotion.mutateAsync({ 
        id, 
        data: payload as unknown as UpdatePromotionDto 
      });
      
      router.push(`/promotions/${id}`);
    } catch (error) {
      console.error("Failed to update promotion:", error);
    }
  };

  const handleCancel = () => {
    router.push(`/promotions/${id}`);
  };

  // --- RENDER LOGIC ---

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  // Trường hợp 1: Không tìm thấy
  if (!promotion) {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
          <AlertTriangle className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Không tìm thấy khuyến mãi
        </h2>
        <Link href="/promotions" className="text-blue-600 hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  // Trường hợp 2: Check trạng thái
  if (promotion.status !== "pending") {
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-yellow-100 p-4 dark:bg-yellow-900/30">
          <AlertTriangle className="h-8 w-8 text-yellow-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Không thể chỉnh sửa
        </h2>
        <p className="text-center text-gray-500 max-w-md">
          Chương trình <strong>{promotion.promotionName}</strong> đang ở trạng thái <span className="font-bold uppercase">{promotion.status}</span>.
          <br />
          Hệ thống chỉ cho phép chỉnh sửa các chương trình đang <strong>Chờ duyệt</strong>.
        </p>
        <div className="flex gap-3">
            <Link 
            href="/promotions" 
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
            Về danh sách
            </Link>
            <Link 
            href={`/promotions/${id}`} 
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
            Xem chi tiết
            </Link>
        </div>
      </div>
    );
  }

  // Trường hợp 3: Map dữ liệu vào form
  const initialFormData: Partial<CreatePromotionFormData> = {
    promotionCode: promotion.promotionCode,
    promotionName: promotion.promotionName,
    promotionType: promotion.promotionType,
    discountValue: promotion.discountValue ?? 0,
    maxDiscountValue: promotion.maxDiscountValue ?? undefined,
    startDate: new Date(promotion.startDate).toISOString().split('T')[0],
    endDate: new Date(promotion.endDate).toISOString().split('T')[0],
    isRecurring: promotion.isRecurring,
    applicableTo: promotion.applicableTo,
    minOrderValue: promotion.minOrderValue,
    minQuantity: promotion.minQuantity,
    quantityLimit: promotion.quantityLimit ?? undefined,
    conditions: promotion.conditions || undefined,
    products: promotion.products?.map((p: any) => ({
      productId: p.productId,
      minQuantity: p.minQuantity,
      giftProductId: p.giftProductId ?? undefined, 
      giftQuantity: p.giftQuantity,
      discountValueOverride: p.discountValueOverride ?? undefined,
      note: p.note ?? undefined,
    })) || [],
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/promotions/${id}`}
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cập Nhật Khuyến Mãi
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-mono">
            {promotion.promotionCode}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <PromotionForm
              initialData={initialFormData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={updatePromotion.isPending}
            />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-5 dark:border-yellow-800 dark:bg-yellow-900/20">
            <h3 className="flex items-center gap-2 font-semibold text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="h-4 w-4" />
              Lưu ý quan trọng
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-yellow-800 dark:text-yellow-400">
              <li>• Mã khuyến mãi và Loại chương trình <strong>không thể thay đổi</strong>.</li>
              <li>• Mọi thay đổi sẽ được ghi lại trong lịch sử hệ thống.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}