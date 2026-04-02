"use client";

import React from "react";
import type { ReconciliationStatus } from "@/types/debt-reconciliation.types";
import { CheckCircle, AlertCircle } from "lucide-react"; // ✅ Dùng AlertCircle cho nợ

interface Props {
  status: ReconciliationStatus; // 'paid' | 'unpaid'
  size?: "sm" | "md";
  showLabel?: boolean;
}

export default function ReconciliationStatusBadge({ 
  status, 
  size = "md", 
  showLabel = true 
}: Props) {
  
  // 1. Cấu hình giao diện cho từng trạng thái
  const statusConfig = {
    paid: {
      label: "Đã thanh toán", // Hoặc "Hết nợ"
      icon: CheckCircle,
      // Màu Xanh lá - An toàn
      className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
    },
    unpaid: {
      label: "Còn nợ", // ✅ Đổi label ngắn gọn hơn
      icon: AlertCircle, // ✅ Đổi icon cảnh báo
      // Màu Đỏ - Cảnh báo
      className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
    }
  };

  // 2. Lấy config hiện tại (Fallback về unpaid nếu status lạ)
  const config = statusConfig[status] || statusConfig.unpaid;
  const Icon = config.icon;

  // 3. Xử lý kích thước
  const containerSize = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <span 
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.className} ${containerSize}`}
    >
      <Icon className={iconSize} />
      {showLabel && config.label}
    </span>
  );
}