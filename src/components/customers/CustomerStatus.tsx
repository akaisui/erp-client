"use client";

import React from "react";
import Badge, { BadgeColor } from "@/components/ui/badge/Badge";
import { CustomerStatus, CustomerType, CustomerClassification } from "@/types";
import { 
  CUSTOMER_STATUS_COLORS, 
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_CLASSIFICATION_LABELS
} from "@/lib/constants";
import { UserCheck, UserX, Lock, Building2, User } from "lucide-react";

// --- Badge Trạng thái ---
export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const Icon = status === 'active' ? UserCheck : status === 'inactive' ? UserX : Lock;
  
  return (
    <Badge color={CUSTOMER_STATUS_COLORS[status] as BadgeColor}>
      <Icon className="mr-1 h-3 w-3" />
      {CUSTOMER_STATUS_LABELS[status]}
    </Badge>
  );
}

// --- Badge Loại khách hàng ---
export function CustomerTypeBadge({ type }: { type: CustomerType }) {
  const isCompany = type === 'company';
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium border ${
      isCompany 
        ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800" 
        : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
    }`}>
      {isCompany ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
      {CUSTOMER_TYPE_LABELS[type]}
    </div>
  );
}

// --- Badge Phân loại (VIP/Sỉ/Lẻ) ---
export function ClassificationBadge({ type }: { type: CustomerClassification }) {
  let colorClass = "bg-gray-100 text-gray-800";
  
  if (type === 'vip') colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
  else if (type === 'wholesale') colorClass = "bg-indigo-100 text-indigo-800 border-indigo-200";
  else if (type === 'retail') colorClass = "bg-teal-100 text-teal-800 border-teal-200";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border border-transparent ${colorClass}`}>
      {CUSTOMER_CLASSIFICATION_LABELS[type]}
    </span>
  );
}