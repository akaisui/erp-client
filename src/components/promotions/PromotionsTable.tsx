"use client";

import React from "react";
import { Eye, Ban, AlertCircle } from "lucide-react";
import type { Promotion } from "@/types/promotion.types";
import { APPLICABLE_TO_LABELS } from "@/lib/validations/promotion.schema";

// Import các component hiển thị con
import PromotionStatus, { 
  PromotionTypeBadge, 
  DiscountValueDisplay, 
  DateRangeDisplay,
  UsageProgressBar 
} from "./PromotionStatus";

interface PromotionsTableProps {
  data: Promotion[];
  isLoading?: boolean;
  onView: (promotion: Promotion) => void;
  onStop: (id: number) => void;
}

export default function PromotionsTable({
  data,
  isLoading,
  onView,
  onStop,
}: PromotionsTableProps) {
  
  if (isLoading) {
    return (
      <div className="w-full space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex h-16 animate-pulse items-center justify-between gap-4">
            <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <AlertCircle className="mb-2 h-8 w-8 text-gray-400" />
        <p className="text-sm text-gray-500">Chưa có dữ liệu khuyến mãi</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <tr>
              <th className="px-6 py-3 font-semibold uppercase tracking-wider">Chương trình</th>
              <th className="px-6 py-3 font-semibold uppercase tracking-wider">Ưu đãi</th>
              <th className="px-6 py-3 font-semibold uppercase tracking-wider">Thời gian</th>
              <th className="px-6 py-3 font-semibold uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((promo) => (
              <tr key={promo.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                
                {/* 1. Tên & Mã */}
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span 
                      className="font-bold text-gray-900 dark:text-white line-clamp-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" 
                      title={promo.promotionName}
                      onClick={() => onView(promo)} // Bấm vào tên cũng xem chi tiết cho tiện
                    >
                      {promo.promotionName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                        {promo.promotionCode}
                      </span>
                      <span className="text-xs text-gray-500">
                        • {APPLICABLE_TO_LABELS[promo.applicableTo] || promo.applicableTo}
                      </span>
                    </div>
                  </div>
                </td>

                {/* 2. Loại & Giá trị */}
                <td className="px-6 py-4">
                  <div className="flex flex-col items-start gap-1.5">
                    <PromotionTypeBadge type={promo.promotionType} size="sm" />
                    <DiscountValueDisplay promotion={promo} />
                  </div>
                </td>

                {/* 3. Thời gian & Progress */}
                <td className="px-6 py-4 min-w-[200px]">
                  <div className="space-y-2">
                    <DateRangeDisplay 
                      startDate={promo.startDate} 
                      endDate={promo.endDate} 
                      isRecurring={promo.isRecurring}
                    />
                    <div className="w-32">
                        <UsageProgressBar 
                            usageCount={promo.usageCount} 
                            quantityLimit={promo.quantityLimit} 
                            size="sm" 
                        />
                    </div>
                  </div>
                </td>

                {/* 4. Trạng thái */}
                <td className="px-6 py-4">
                  <PromotionStatus status={promo.status} size="sm" />
                </td>

                {/* 5. Thao tác (Đã đảo vị trí: Dừng trái - Xem phải) */}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-2">
                    
                    {/* Nút Dừng khuyến mãi (Bên TRÁI - Màu đỏ) */}
                    {/* Chỉ hiện khi Active hoặc Pending */}
                    {(promo.status === "active" || promo.status === "pending") && (
                      <button
                        className="group/btn inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation(); // Tránh kích hoạt click row
                          onStop(promo.id);
                        }}
                        title="Dừng khuyến mãi này"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    )}

                    {/* Nút Xem chi tiết (Bên PHẢI - Màu xanh/xám) */}
                    {/* Luôn hiện */}
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(promo);
                      }}
                      title="Xem chi tiết"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}