/**
 * SalaryStatus Component
 * Reusable components for displaying salary-related information
 */

import React from "react";
import {
  SalaryStatus as SalaryStatusType,
  PaymentMethod,
  SALARY_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  SALARY_COMPONENT_LABELS,
  formatMonth,
} from "@/types/salary.types";
import { formatCurrency } from "@/lib/utils";
import {
  CheckCircle,
  Clock,
  Banknote,
  AlertCircle,
} from "lucide-react";

//----------------------------------------------
// Status Badge Component
//----------------------------------------------

export interface SalaryStatusBadgeProps {
  status: SalaryStatusType;
  className?: string;
}

/**
 * Display salary status as a colored badge
 */
export default function SalaryStatusBadge({
  status,
  className = "",
}: SalaryStatusBadgeProps) {
  const getStatusColor = (status: SalaryStatusType): string => {
    const colors: Record<SalaryStatusType, string> = {
      pending:
        "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700",
      approved:
        "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
      paid: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
    };
    return colors[status];
  };

  const getStatusIcon = (status: SalaryStatusType) => {
    const icons: Record<SalaryStatusType, React.ReactNode> = {
      pending: <Clock className="w-4 h-4" />,
      approved: <CheckCircle className="w-4 h-4" />,
      paid: <Banknote className="w-4 h-4" />,
    };
    return icons[status];
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
        status
      )} ${className}`}
    >
      {getStatusIcon(status)}
      {SALARY_STATUS_LABELS[status]}
    </span>
  );
}

//----------------------------------------------
// Payment Method Display
//----------------------------------------------

export interface PaymentMethodDisplayProps {
  method: PaymentMethod;
  className?: string;
}

/**
 * Display payment method
 */
export function PaymentMethodDisplay({
  method,
  className = "",
}: PaymentMethodDisplayProps) {
  const getMethodIcon = (method: PaymentMethod) => {
    const icons: Record<PaymentMethod, React.ReactNode> = {
      cash: <Banknote className="w-4 h-4" />,
      transfer: <Banknote className="w-4 h-4" />,
      installment: <Banknote className="w-4 h-4" />,
      credit: <Banknote className="w-4 h-4" />,
    };
    return icons[method];
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 ${className}`}
    >
      {getMethodIcon(method)}
      {PAYMENT_METHOD_LABELS[method]}
    </span>
  );
}

//----------------------------------------------
// Month Display
//----------------------------------------------

export interface MonthDisplayProps {
  month: string; // YYYYMM
  className?: string;
}

/**
 * Display month in readable format
 */
export function MonthDisplay({ month, className = "" }: MonthDisplayProps) {
  return (
    <span className={`text-sm font-medium ${className}`}>
      {formatMonth(month)}
    </span>
  );
}

//----------------------------------------------
// Currency Display
//----------------------------------------------

export interface CurrencyDisplayProps {
  amount: number;
  label?: string;
  positive?: boolean; // Force positive color
  negative?: boolean; // Force negative color
  className?: string;
}

/**
 * Display currency with formatting and optional color coding
 */
export function CurrencyDisplay({
  amount,
  label,
  positive,
  negative,
  className = "",
}: CurrencyDisplayProps) {
  const getColorClass = () => {
    if (positive) return "text-green-600 dark:text-green-400";
    if (negative) return "text-red-600 dark:text-red-400";
    if (amount < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-900 dark:text-gray-100";
  };

  return (
    <div className={`${className}`}>
      {label && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </div>
      )}
      <div className={`text-sm font-semibold ${getColorClass()}`}>
        {formatCurrency(amount)}
      </div>
    </div>
  );
}

//----------------------------------------------
// Salary Breakdown Card
//----------------------------------------------

export interface SalaryBreakdownProps {
  basicSalary: number;
  allowance: number;
  overtimePay: number;
  bonus: number;
  commission: number;
  deduction: number;
  advance: number;
  totalSalary: number;
  className?: string;
}

/**
 * Display salary breakdown with all components
 */
export function SalaryBreakdown({
  basicSalary,
  allowance,
  overtimePay,
  bonus,
  commission,
  deduction,
  advance,
  totalSalary,
  className = "",
}: SalaryBreakdownProps) {
  const additions = basicSalary + allowance + overtimePay + bonus + commission;
  const deductions = deduction + advance;

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Chi tiết lương
      </h3>

      {/* Income Items */}
      <div className="space-y-2 mb-3">
        <SalaryLineItem
          label={SALARY_COMPONENT_LABELS.basicSalary}
          amount={basicSalary}
          positive
        />
        {allowance > 0 && (
          <SalaryLineItem
            label={SALARY_COMPONENT_LABELS.allowance}
            amount={allowance}
            positive
          />
        )}
        {overtimePay > 0 && (
          <SalaryLineItem
            label={SALARY_COMPONENT_LABELS.overtimePay}
            amount={overtimePay}
            positive
          />
        )}
        {bonus > 0 && (
          <SalaryLineItem
            label={SALARY_COMPONENT_LABELS.bonus}
            amount={bonus}
            positive
          />
        )}
        {commission > 0 && (
          <SalaryLineItem
            label={SALARY_COMPONENT_LABELS.commission}
            amount={commission}
            positive
          />
        )}
      </div>

      {/* Subtotal Additions */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mb-3">
        <SalaryLineItem
          label="Tổng thu nhập"
          amount={additions}
          bold
          positive
        />
      </div>

      {/* Deduction Items */}
      {(deduction > 0 || advance > 0) && (
        <div className="space-y-2 mb-3">
          {deduction > 0 && (
            <SalaryLineItem
              label={SALARY_COMPONENT_LABELS.deduction}
              amount={deduction}
              negative
            />
          )}
          {advance > 0 && (
            <SalaryLineItem
              label={SALARY_COMPONENT_LABELS.advance}
              amount={advance}
              negative
            />
          )}
        </div>
      )}

      {/* Subtotal Deductions */}
      {deductions > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mb-3">
          <SalaryLineItem
            label="Tổng khấu trừ"
            amount={deductions}
            bold
            negative
          />
        </div>
      )}

      {/* Total */}
      <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-3">
        <SalaryLineItem
          label={SALARY_COMPONENT_LABELS.totalSalary}
          amount={totalSalary}
          bold
          large
        />
      </div>
    </div>
  );
}

//----------------------------------------------
// Salary Line Item (Internal)
//----------------------------------------------

interface SalaryLineItemProps {
  label: string;
  amount: number;
  positive?: boolean;
  negative?: boolean;
  bold?: boolean;
  large?: boolean;
}

function SalaryLineItem({
  label,
  amount,
  positive,
  negative,
  bold,
  large,
}: SalaryLineItemProps) {
  const getColorClass = () => {
    if (positive) return "text-green-600 dark:text-green-400";
    if (negative) return "text-red-600 dark:text-red-400";
    return "text-gray-900 dark:text-gray-100";
  };

  const fontClass = bold ? "font-semibold" : "font-medium";
  const sizeClass = large ? "text-base" : "text-sm";

  return (
    <div className="flex items-center justify-between">
      <span
        className={`${sizeClass} text-gray-600 dark:text-gray-400 ${
          bold ? "font-semibold" : ""
        }`}
      >
        {label}
      </span>
      <span className={`${sizeClass} ${fontClass} ${getColorClass()}`}>
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

//----------------------------------------------
// Salary Summary Card (for dashboard)
//----------------------------------------------

export interface SalarySummaryCardProps {
  title: string;
  amount: number;
  icon?: React.ReactNode;
  trend?: {
    value: number; // percentage
    isPositive: boolean;
  };
  className?: string;
}

/**
 * Summary card for dashboard
 */
export function SalarySummaryCard({
  title,
  amount,
  icon,
  trend,
  className = "",
}: SalarySummaryCardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </span>
        {icon && (
          <div className="text-gray-400 dark:text-gray-500">{icon}</div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {formatCurrency(amount)}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className={`text-xs font-medium ${
              trend.isPositive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            so với tháng trước
          </span>
        </div>
      )}
    </div>
  );
}

//----------------------------------------------
// Posted Status Indicator
//----------------------------------------------

export interface PostedStatusProps {
  isPosted: boolean;
  className?: string;
}

/**
 * Display posting status (for accounting)
 */
export function PostedStatus({ isPosted, className = "" }: PostedStatusProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        isPosted
          ? "bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700"
          : "bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700"
      } ${className}`}
    >
      {isPosted ? (
        <>
          <CheckCircle className="w-4 h-4" />
          Đã hạch toán
        </>
      ) : (
        <>
          <AlertCircle className="w-4 h-4" />
          Chưa hạch toán
        </>
      )}
    </span>
  );
}
