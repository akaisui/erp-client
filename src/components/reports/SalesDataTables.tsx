"use client";

import React, { useState } from "react";
import { getClassificationName } from "@/types/report.types";
import type { SalesReport, TopProduct, StaffPerformance, TopCustomer } from "@/types/report.types";
import ReportCard from "./ReportCard";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface SalesDataTablesProps {
  data: SalesReport;
  isLoading?: boolean;
}

type TabType = "products" | "staff" | "customers";

export default function SalesDataTables({ data, isLoading = false }: SalesDataTablesProps) {
  const [activeTab, setActiveTab] = useState<TabType>("products");

  if (isLoading) {
    return (
      <div className="h-96 animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700" />
    );
  }

  const tabs = [
    { id: "products", label: "Top Sản phẩm", count: data.topProducts?.length || 0 },
    { id: "staff", label: "Hiệu quả Nhân viên", count: data.staffPerformance?.length || 0 },
    { id: "customers", label: "Top Khách hàng", count: data.topCustomers?.length || 0 },
  ];

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

      {/* TAB 1: TOP PRODUCTS */}
      {activeTab === "products" && (
        <ReportCard title="Top Sản phẩm Bán chạy">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Xếp hạng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Sản phẩm
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Số lượng
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Doanh thu
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tỷ lệ
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Đơn hàng
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {!data.topProducts?.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  data.topProducts.map((product: TopProduct, idx) => (
                    <tr key={product.productId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3 text-center">
                        {idx < 3 ? (
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                              idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-gray-400" : "bg-orange-600"
                            }`}
                          >
                            {idx + 1}
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-gray-500">{idx + 1}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{product.productName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{product.sku}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        {formatNumber(product.quantitySold)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(product.revenue)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-blue-600 dark:text-blue-400 font-medium">
                        {(product.revenue / (data.summary.netRevenue || 1) * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                        {product.orderCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ReportCard>
      )}

      {/* TAB 2: STAFF PERFORMANCE */}
      {activeTab === "staff" && (
        <ReportCard title="Hiệu quả Nhân viên Bán hàng">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Nhân viên
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Số đơn
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Doanh số
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Thực thu
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Công nợ phát sinh
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tỷ lệ hoàn tất
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {!data.staffPerformance?.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  data.staffPerformance.map((staff: StaffPerformance) => (
                    <tr key={staff.staffId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {staff.avatar && (
                            <img src={staff.avatar} alt={staff.staffName} className="h-8 w-8 rounded-full object-cover" />
                          )}
                          <div className="font-medium text-gray-900 dark:text-white">{staff.staffName}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        {staff.totalOrders}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(staff.totalRevenue)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">
                        {formatCurrency(staff.paidRevenue)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-orange-600 dark:text-orange-400">
                        {formatCurrency(staff.debtAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(staff.completionRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white w-10 text-right">
                            {Math.min(staff.completionRate, 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ReportCard>
      )}

      {/* TAB 3: TOP CUSTOMERS */}
      {activeTab === "customers" && (
        <ReportCard title="Top Khách hàng">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Phân loại
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Số đơn
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tổng mua
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Đã trả
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Công nợ hiện tại
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {!data.topCustomers?.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  data.topCustomers.map((customer: TopCustomer) => (
                    <tr key={customer.customerId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{customer.customerName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{customer.customerCode}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                          {getClassificationName(customer.classification)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        {customer.totalOrders}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(customer.totalRevenue)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">
                        {formatCurrency(customer.totalPaid)}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-medium ${customer.currentDebt > 0 ? "text-orange-600 dark:text-orange-400" : "text-gray-500"}`}>
                        {formatCurrency(customer.currentDebt)}
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
