/**
 * Production Timeline Component
 * Timeline hiển thị tiến trình sản xuất
 */

import React from "react";
import { format } from "date-fns";
import {
  Calendar,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";
import type { ProductionOrder } from "@/types";

interface ProductionTimelineProps {
  order: ProductionOrder;
}

export function ProductionTimeline({ order }: ProductionTimelineProps) {
  const events = [
    {
      id: "created",
      type: "created",
      icon: FileText,
      title: "Lệnh sản xuất được tạo",
      timestamp: order.createdAt,
      user: order.creator,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      description: `Số lượng kế hoạch: ${order.plannedQuantity} ${order.finishedProduct?.unit || ""}`,
      completed: true,
    },
    {
      id: "started",
      type: "started",
      icon: Play,
      title: "Bắt đầu sản xuất",
      timestamp: order.status === "pending" ? null : order.approvedAt,
      user: order.approver,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      description:
        order.status === "pending"
          ? "Chưa bắt đầu"
          : "Nguyên liệu đã được xuất kho",
      completed: order.status !== "pending",
    },
    {
      id: "completed",
      type: "completed",
      icon: CheckCircle,
      title: "Hoàn thành sản xuất",
      timestamp: order.completedAt,
      user: null,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      description:
        order.status === "completed"
          ? `Sản xuất được: ${order.actualQuantity} ${order.finishedProduct?.unit || ""}`
          : "Chưa hoàn thành",
      completed: order.status === "completed",
    },
  ];

  // Add cancelled event if order is cancelled
  if (order.status === "cancelled") {
    events.push({
      id: "cancelled",
      type: "cancelled",
      icon: XCircle,
      title: "Lệnh sản xuất bị hủy",
      timestamp: order.cancelledAt,
      user: order.canceller,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      description: order.notes || "Không có ghi chú",
      completed: true,
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Tiến trình sản xuất
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700" />

        {/* Timeline events */}
        <div className="space-y-6">
          {events.map((event, index) => {
            const Icon = event.icon;
            return (
              <div key={event.id} className="relative flex gap-4">
                {/* Icon */}
                <div
                  className={`z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                    event.completed
                      ? event.bgColor
                      : "bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      event.completed
                        ? event.color
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4
                        className={`font-semibold ${
                          event.completed
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {event.title}
                      </h4>
                      {event.timestamp && (
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(event.timestamp), "dd/MM/yyyy HH:mm")}
                          </span>
                        </div>
                      )}
                      {event.user && (
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>Bởi: {event.user.fullName}</span>
                        </div>
                      )}
                    </div>
                    {!event.completed && event.id !== "cancelled" && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>Đang chờ</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {event.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Production period */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">
          Khoảng thời gian sản xuất
        </h4>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ngày bắt đầu
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              {format(new Date(order.startDate), "dd/MM/yyyy")}
            </p>
          </div>
          {order.endDate && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ngày kết thúc
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {format(new Date(order.endDate), "dd/MM/yyyy")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
