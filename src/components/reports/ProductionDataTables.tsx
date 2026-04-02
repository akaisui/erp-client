"use client";

import React, { useState } from "react";
import { formatPercentage } from "@/types/report.types";
import type { ProductionReport } from "@/types/report.types";
import ReportCard from "./ReportCard";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface ProductionDataTablesProps {
  data: ProductionReport;
  isLoading?: boolean;
}

type TabType = "orders" | "output" | "materials";

export default function ProductionDataTables({ data, isLoading = false }: ProductionDataTablesProps) {
  const [activeTab, setActiveTab] = useState<TabType>("orders");

  if (isLoading) {
    return (
      <div className="h-96 animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700" />
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-center text-sm text-gray-500">Không có dữ liệu</p>
      </div>
    );
  }

  const tabs = [
    { id: "orders", label: "Theo dõi Lệnh SX", count: data.orders?.length || 0 },
    { id: "output", label: "Sản lượng theo SP", count: data.output?.length || 0 },
    { id: "materials", label: "Tiêu hao Nguyên liệu", count: data.materialConsumption?.length || 0 },
  ];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "✅ Hoàn thành";
      case "in_progress":
        return "⏳ Đang chạy";
      case "pending":
        return "⏸️ Chờ xử lý";
      case "cancelled":
        return "❌ Hủy";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-3 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Tab A: Theo dõi Lệnh SX */}
      {activeTab === "orders" && (
        <ReportCard title="Theo dõi Lệnh Sản xuất">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Mã lệnh
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Sản phẩm
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tiến độ
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Ngày bắt đầu
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Dự kiến hoàn
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {data.orders?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  data.orders?.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {order.orderCode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{order.productName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-xs">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                className={`h-full transition-all ${
                                  order.completionPercentage >= 100
                                    ? "bg-green-500"
                                    : order.completionPercentage >= 80
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${Math.min(order.completionPercentage, 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {formatPercentage(Math.min(order.completionPercentage, 100))}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatNumber(order.actualQuantity)} / {formatNumber(order.plannedQuantity)}
                        </div>
                      </td>
                      <td className="text-center px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                        {new Date(order.startDate).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                        {order.expectedEndDate ? new Date(order.expectedEndDate).toLocaleDateString("vi-VN") : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ReportCard>
      )}

      {/* Tab B: Sản lượng theo SP */}
      {activeTab === "output" && (
        <ReportCard title="Sản lượng theo Sản phẩm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Sản phẩm
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Kế hoạch
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Thực tế
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Hoàn thành
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Hao hụt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {data.output?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  data.output?.map((item) => (
                    <tr key={item.productId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.productName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                        {formatNumber(item.plannedQuantity)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        {formatNumber(item.producedQuantity)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                        <span
                          className={`font-medium ${
                            item.completionRate >= 100
                              ? "text-green-600 dark:text-green-400"
                              : item.completionRate >= 80
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {formatPercentage(item.completionRate)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                        {formatNumber(item.wastage)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ReportCard>
      )}

      {/* Tab C: Tiêu hao Nguyên liệu */}
      {activeTab === "materials" && (
        <ReportCard title="Tiêu hao Nguyên liệu">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Nguyên liệu
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Kế hoạch
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Thực tế
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Chênh lệch
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    💰 Giá trị hao hụt
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {data.materialConsumption?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  data.materialConsumption?.map((material) => (
                    <tr key={material.materialId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {material.materialName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                        {formatNumber(material.plannedQuantity)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        {formatNumber(material.actualQuantity)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                        <span
                          className={`font-medium ${
                            material.variance > 0
                              ? "text-red-600 dark:text-red-400"
                              : material.variance < 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {material.variance > 0 ? "+" : ""}
                          {formatNumber(material.variance)} ({formatPercentage(material.variancePercentage)})
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium">
                        <span className={material.wastageValue > 0 ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"}>
                          {material.wastageValue > 0 ? "⚠️ " : ""}
                          {formatCurrency(material.wastageValue)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ReportCard>
      )}
    </div>
  );
}
