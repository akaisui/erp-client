"use client";

import React, { useEffect } from "react";
import { useCreatePromotion, useUpdatePromotion, usePromotion } from "@/hooks/api/usePromotions";
import PromotionForm from "@/components/promotions/PromotionForm";
import { Modal } from "@/components/ui/modal";
import type { CreatePromotionDto, UpdatePromotionDto, Promotion, ApiResponse } from "@/types";
import { AlertTriangle } from "lucide-react";

interface PromotionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    promotionId: number | null;
}

export function PromotionDialog({
    isOpen,
    onClose,
    promotionId,
}: PromotionDialogProps) {
    const createPromotion = useCreatePromotion();
    const updatePromotion = useUpdatePromotion();

    const isEditMode = !!promotionId;

    // --- LOGIC SỬA LỖI ---
    // Hook usePromotion(id) của bạn có 'enabled: !!id'.
    // Ta tận dụng điều này: Nếu Dialog mở VÀ có ID thì truyền ID thật -> Hook chạy.
    // Nếu Dialog đóng HOẶC không có ID -> truyền 0 -> Hook tự dừng.
    const idToFetch = (isOpen && promotionId) ? promotionId : 0;

    // Gọi với 1 tham số duy nhất -> Hết lỗi "Expected 1 arguments"
    const { data: dataWrapper, isLoading: isLoadingDetail } = usePromotion(idToFetch);

    const promotion = (dataWrapper as unknown as ApiResponse<Promotion>)?.data;

    // Xử lý Submit
    // Trong PromotionDialog.tsx -> tìm hàm handleSubmit và thay thế bằng đoạn này:

    const handleSubmit = async (data: any) => {
        try {
            // 1. Chuyển đổi dữ liệu ngày tháng
            const payloadRaw = {
                ...data,
                startDate: new Date(data.startDate).toISOString(),
                endDate: new Date(data.endDate).toISOString(),

                // 2. Xử lý kỹ mảng products để tránh gửi số 0
                products: data.products && data.products.length > 0
                    ? data.products.map((p: any) => ({
                        productId: p.productId,
                        minQuantity: p.minQuantity,
                        // SỬA Ở ĐÂY: Nếu = 0 thì gửi undefined
                        giftProductId: p.giftProductId || undefined,
                        giftQuantity: p.giftQuantity ? p.giftQuantity : undefined, // <--- Fix lỗi giftQuantity >= 1
                        discountValueOverride: p.discountValueOverride || undefined,
                        note: p.note || undefined,
                    }))
                    : undefined,
            };

            if (isEditMode && promotionId) {
                await updatePromotion.mutateAsync({ id: promotionId, data: payloadRaw as UpdatePromotionDto });
            } else {
                await createPromotion.mutateAsync(payloadRaw as CreatePromotionDto);
            }
            onClose();
        } catch (error) {
            console.error("Failed to save promotion:", error);
        }
    };
    // Map dữ liệu
    const initialFormData = promotion ? {
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
    } : undefined;

    // Loading UI
    if (idToFetch !== 0 && isLoadingDetail) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                </div>
            </Modal>
        );
    }

    // Validate Status (Chỉ hiển thị khi đã load xong data)
    if (isEditMode && promotion && promotion.status !== 'pending') {
        return (
            <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
                <div className="flex flex-col items-center justify-center space-y-4 p-6">
                    <div className="rounded-full bg-yellow-100 p-4 dark:bg-yellow-900/30">
                        <AlertTriangle className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Không thể chỉnh sửa</h2>
                    <p className="text-center text-gray-500 text-sm">
                        Chương trình <strong>{promotion.promotionName}</strong> đang ở trạng thái <span className="font-bold uppercase">{promotion.status}</span>.
                        <br />Chỉ được sửa chương trình <strong>Pending</strong>.
                    </p>
                    <button onClick={onClose} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                        Đóng
                    </button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="!max-w-none w-[95vw] h-[95vh] flex flex-col"
        >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isEditMode ? "Cập Nhật Khuyến Mãi" : "Tạo Chương Trình Khuyến Mãi"}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {isEditMode ? `Mã: ${promotion?.promotionCode || '...'}` : "Điền thông tin bên dưới để tạo chương trình mới"}
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
                    <PromotionForm
                        initialData={initialFormData}
                        onSubmit={handleSubmit}
                        onCancel={onClose}
                        loading={createPromotion.isPending || updatePromotion.isPending}
                    />
                </div>
            </div>
        </Modal>
    );
}