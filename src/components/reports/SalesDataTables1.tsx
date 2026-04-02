"use client";

import React, { useState } from "react";
import { formatCurrencyVND, formatNumber, formatPercentage } from "@/types/report.types";
import type { SalesReport } from "@/types/report.types";
import ReportCard from "./ReportCard";
import Link from "next/link";

interface SalesDataTablesProps {
  data: SalesReport;
  isLoading?: boolean;
}

type TabType = "products" | "employees" | "customers";

export default function SalesDataTables({ data, isLoading = false }: SalesDataTablesProps) {
  const [activeTab, setActiveTab] = useState<TabType>("products");

  if (isLoading) {
    return (
      <div className="h-96 animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700" />
    );
  }

  const tabs = [
    { id: "products", label: "Hiệu suất Sản phẩm", count: data.topProducts?.length || 0 },
    { id: "employees", label: "Hiệu suất Nhân viên", count: data.byEmployee?.length || 0 },
    { id: "customers", label: "Khách hàng", count: data.topCustomers?.length || 0 },
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

      {/* Tab Content */}
      {activeTab === "products" && (
        <ReportCard title="Hiệu suất Sản phẩm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Sản phẩm
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    SL bán
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Doanh thu
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tỷ lệ %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {data.topProducts?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  data.topProducts?.map((product, idx) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {idx < 3 && (
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                              idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-gray-400" : "bg-orange-600"
                            }`}>
                              {idx + 1}
                            </span>
                          )}
                          {idx >= 3 && <span className="text-xs text-gray-400">{idx + 1}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {product.image && (
                            <img src={product.image} alt={product.productName} className="h-8 w-8 rounded object-cover" />
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{product.productName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        {formatNumber(product.quantity)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrencyVND(product.revenue)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        {formatPercentage(product.percentageOfTotal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ReportCard>
      )}

      {activeTab === "employees" && (
        <ReportCard title="Hiệu suất Nhân viên Bán hàng">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Nhân viên
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Đơn xử lý
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Doanh số
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Thực thu
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Hoa hồng
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {data.byEmployee?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  data.byEmployee?.map((employee, idx) => (
                    <tr key={employee.employeeId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {employee.avatar && (
                            <img src={employee.avatar} alt={employee.employeeName} className="h-8 w-8 rounded-full object-cover" />
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{employee.employeeName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{employee.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        {formatNumber(employee.ordersHandled)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrencyVND(employee.revenue)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        {formatCurrencyVND(employee.paidAmount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-green-600 dark:text-green-400 font-medium">
                        {formatCurrencyVND(employee.commission)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ReportCard>
      )}

      {activeTab === "customers" && (
        <ReportCard title="Khách hàng Tiềm năng">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    STT
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Khách hàng
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Số đơn
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tổng mua
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Nợ hiện tại
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {data.topCustomers?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  data.topCustomers?.map((customer, idx) => (
                    <tr key={customer.customerId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{customer.customerName}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              customer.classification === "vip"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                : customer.classification === "wholesale"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                            }`}>
                              {customer.classification === "vip" ? "⭐ VIP" : customer.classification === "wholesale" ? "🏢 Sỉ" : "Lẻ"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        {formatNumber(customer.totalOrders)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrencyVND(customer.totalRevenue)}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 text-right text-sm font-medium ${
                        customer.currentDebt > customer.creditLimit * 0.8
                          ? "text-red-600 dark:text-red-400"
                          : "text-orange-600 dark:text-orange-400"
                      }`}>
                        {formatCurrencyVND(customer.currentDebt)}
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
