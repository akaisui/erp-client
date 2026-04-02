"use client";

/**
 * Order Timeline Component
 * Hiển thị timeline lịch sử trạng thái đơn hàng
 */

import React from "react";
import { SalesOrder } from "@/types";
import { format } from "date-fns";
import {
  FileText,
  CheckCircle,
  Truck,
  XCircle,
  Clock,
  User,
} from "lucide-react";

interface OrderTimelineProps {
  order: SalesOrder;
}

interface TimelineEvent {
  icon: React.ReactNode;
  title: string;
  description: string;
  timestamp?: string;
  user?: string;
  color: string;
}

export default function OrderTimeline({ order }: OrderTimelineProps) {
  const events: TimelineEvent[] = [];

  // Created
  events.push({
    icon: <FileText className="h-5 w-5" />,
    title: "Đơn hàng đã tạo",
    description: `Đơn hàng ${order.orderCode} đã được tạo`,
    timestamp: order.createdAt,
    user: order.creator?.fullName,
    color: "bg-blue-500",
  });

  // Approved
  if (order.approvedAt) {
    events.push({
      icon: <CheckCircle className="h-5 w-5" />,
      title: "Đơn hàng đã duyệt",
      description: "Đơn hàng đã được phê duyệt",
      timestamp: order.approvedAt,
      user: order.approver?.fullName,
      color: "bg-green-500",
    });
  }

  // In Progress
  if (order.orderStatus === "in_progress") {
    events.push({
      icon: <Truck className="h-5 w-5" />,
      title: "Đang xử lý",
      description: "Đơn hàng đang được xử lý và chuẩn bị giao",
      color: "bg-yellow-500",
    });
  }

  // Completed
  if (order.completedAt) {
    events.push({
      icon: <CheckCircle className="h-5 w-5" />,
      title: "Hoàn thành",
      description: "Đơn hàng đã hoàn thành",
      timestamp: order.completedAt,
      color: "bg-green-600",
    });
  }

  // Cancelled
  if (order.cancelledAt) {
    events.push({
      icon: <XCircle className="h-5 w-5" />,
      title: "Đã hủy",
      description: "Đơn hàng đã bị hủy",
      timestamp: order.cancelledAt,
      user: order.canceller?.fullName,
      color: "bg-red-500",
    });
  }

  // Payment events
  if (order.paymentReceipts && order.paymentReceipts.length > 0) {
    order.paymentReceipts.forEach((payment) => {
      events.push({
        icon: <CheckCircle className="h-5 w-5" />,
        title: "Đã thanh toán",
        description: `Thanh toán ${payment.amount.toLocaleString()} VNĐ`,
        timestamp: payment.paymentDate,
        user: payment.creator?.fullName,
        color: "bg-green-500",
      });
    });
  }

  // Sort by timestamp
  events.sort((a, b) => {
    if (!a.timestamp) return -1;
    if (!b.timestamp) return 1;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
        <Clock className="h-5 w-5" />
        Lịch sử đơn hàng
      </h3>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700" />

        {/* Events */}
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={index} className="relative flex gap-4">
              {/* Icon */}
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${event.color} text-white`}
              >
                {event.icon}
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {event.title}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {event.description}
                  </p>
                  {event.timestamp && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                      {format(new Date(event.timestamp), "dd/MM/yyyy HH:mm")}
                    </p>
                  )}
                  {event.user && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                      <User className="h-3 w-3" />
                      {event.user}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
