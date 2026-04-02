// 

"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { usePromotion } from "@/hooks/api/usePromotions";
import { X, Calendar, Tag, ShoppingBag, Users } from "lucide-react"; // Đã bỏ Clock thừa
import PromotionStatus, { PromotionTypeBadge, DiscountValueDisplay } from "@/components/promotions/PromotionStatus";
import type { ApiResponse, Promotion } from "@/types";

interface ViewPromotionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    promotionId: number | null;
}

export function ViewPromotionDialog({
    isOpen,
    onClose,
    promotionId,
}: ViewPromotionDialogProps) {

    // Logic tối ưu: Chỉ fetch khi Dialog mở
    const idToFetch = (isOpen && promotionId) ? promotionId : 0;
    const { data: dataWrapper, isLoading } = usePromotion(idToFetch);

    const promotion = (dataWrapper as unknown as ApiResponse<Promotion>)?.data;

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            className="!max-w-none w-[90vw] h-[90vh] flex flex-col"
        >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chi tiết khuyến mãi</h2>
                    {promotion && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{promotion.promotionCode}</p>
                    )}
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                    </div>
                ) : promotion ? (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Phần giao diện giữ nguyên như bạn đã viết, chỉ paste lại logic render */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* ... (Copy lại phần hiển thị thông tin chính và bảng sản phẩm từ code cũ của bạn) ... */}
                            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thông tin chương trình</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-500">Tên chương trình</label>
                                        <p className="font-medium text-gray-900 dark:text-white">{promotion.promotionName}</p>
                                    </div>
                                    {/* ... các trường khác ... */}
                                    <div>
                                        <label className="text-sm text-gray-500">Trạng thái</label>
                                        <div className="mt-1"><PromotionStatus promotion={promotion} /></div>
                                    </div>
                                </div>
                            </div>
                            {/* ... Bảng sản phẩm ... */}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* ... (Copy lại phần Sidebar thời gian & hiệu lực) ... */}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500">Không tìm thấy dữ liệu</div>
                )}
            </div>
        </Modal>
    );
}