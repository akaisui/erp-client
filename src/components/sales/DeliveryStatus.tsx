"use client";

/**
 * Delivery Status Component
 * Hiển thị và cập nhật trạng thái giao hàng
 */

import React from "react";
import type { Delivery, DeliveryStatus as DeliveryStatusType } from "@/types";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";

interface DeliveryStatusProps {
  delivery: Delivery;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

interface StatusConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  textColor: string;
}

const statusConfigs: Record<DeliveryStatusType, StatusConfig> = {
  pending: {
    label: "Chờ giao",
    icon: <Clock className="h-4 w-4" />,
    color: "bg-gray-500",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    textColor: "text-gray-700 dark:text-gray-300",
  },
  in_transit: {
    label: "Đang giao",
    icon: <Truck className="h-4 w-4" />,
    color: "bg-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-700 dark:text-blue-300",
  },
  delivered: {
    label: "Đã giao",
    icon: <CheckCircle className="h-4 w-4" />,
    color: "bg-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-700 dark:text-green-300",
  },
  failed: {
    label: "Giao thất bại",
    icon: <XCircle className="h-4 w-4" />,
    color: "bg-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-700 dark:text-red-300",
  },
  returned: {
    label: "Đã hoàn trả",
    icon: <AlertCircle className="h-4 w-4" />,
    color: "bg-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-700 dark:text-orange-300",
  },
};

const sizeClasses = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-base",
};

export default function DeliveryStatus({
  delivery,
  size = "md",
  showLabel = true,
}: DeliveryStatusProps) {
  const config = statusConfigs[delivery.deliveryStatus];

  return (
    <div className="inline-flex items-center gap-2">
      {/* Status Badge */}
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses[size]}`}
      >
        {config.icon}
        {showLabel && config.label}
      </span>

      {/* Settlement Status (nếu đã giao) */}
      {delivery.deliveryStatus === "delivered" && delivery.codAmount > 0 && (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-medium ${
            delivery.settlementStatus === "settled"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
          } ${sizeClasses[size]}`}
        >
          {delivery.settlementStatus === "settled" ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Đã quyết toán
            </>
          ) : (
            <>
              <Clock className="h-4 w-4" />
              Chờ quyết toán
            </>
          )}
        </span>
      )}
    </div>
  );
}

/**
 * Delivery Status Select Component
 * Dropdown để chọn trạng thái giao hàng
 */
interface DeliveryStatusSelectProps {
  value: DeliveryStatusType;
  onChange: (status: DeliveryStatusType) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function DeliveryStatusSelect({
  value,
  onChange,
  disabled = false,
  size = "md",
}: DeliveryStatusSelectProps) {
  const config = statusConfigs[value];

  const inputSizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base",
  };

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as DeliveryStatusType)}
        disabled={disabled}
        className={`w-full appearance-none rounded-lg border border-gray-300 bg-white font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white ${config.textColor} ${inputSizeClasses[size]}`}
      >
        {Object.entries(statusConfigs).map(([key, config]) => (
          <option key={key} value={key}>
            {config.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        {config.icon}
      </div>
    </div>
  );
}

/**
 * Delivery Status Stepper
 * Hiển thị trạng thái giao hàng dạng stepper
 */
interface DeliveryStatusStepperProps {
  delivery: Delivery;
}

export function DeliveryStatusStepper({ delivery }: DeliveryStatusStepperProps) {
  const steps: DeliveryStatusType[] = ["pending", "in_transit", "delivered"];

  // Nếu failed hoặc returned thì hiển thị riêng
  if (delivery.deliveryStatus === "failed" || delivery.deliveryStatus === "returned") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white">
            {statusConfigs[delivery.deliveryStatus].icon}
          </div>
          <div>
            <h4 className="font-semibold text-red-900 dark:text-red-100">
              {statusConfigs[delivery.deliveryStatus].label}
            </h4>
            {delivery.failureReason && (
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {delivery.failureReason}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentStepIndex = steps.indexOf(delivery.deliveryStatus);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const config = statusConfigs[step];
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <React.Fragment key={step}>
              {/* Step */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    isActive
                      ? config.color + " text-white"
                      : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    config.icon
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive
                      ? config.textColor
                      : isCompleted
                        ? "text-green-700 dark:text-green-300"
                        : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {config.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 transition-colors ${
                    isCompleted
                      ? "bg-green-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
