"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Bell,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/types/finance.types";
import type { FinancialReport } from "@/types/finance.types";

interface FinancialDataTablesProps {
  data: FinancialReport;
  isLoading?: boolean;
}

type TabType = "pnl" | "cashbook" | "debt";

export default function FinancialDataTables({
  data,
  isLoading = false,
}: FinancialDataTablesProps) {
  const [activeTab, setActiveTab] = useState<TabType>("pnl");

  if (isLoading) {
    return (
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="h-96 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
      </div>
    );
  }

  const profitLoss = data?.profitLoss;
  const cashBook = data?.cashBookEntries || [];
  const customerDebts = data?.customerDebts || [];
  const supplierDebts = data?.supplierDebts || [];

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          <button
            onClick={() => setActiveTab("pnl")}
            className={`flex-1 px-4 py-3 text-center text-sm font-medium transition-colors ${
              activeTab === "pnl"
                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            📊 Kết quả kinh doanh
          </button>
          <button
            onClick={() => setActiveTab("cashbook")}
            className={`flex-1 px-4 py-3 text-center text-sm font-medium transition-colors ${
              activeTab === "cashbook"
                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            💼 Sổ quỹ tiền mặt
          </button>
          <button
            onClick={() => setActiveTab("debt")}
            className={`flex-1 px-4 py-3 text-center text-sm font-medium transition-colors ${
              activeTab === "debt"
                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            📋 Công nợ
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* TAB 1: P&L */}
        {activeTab === "pnl" && profitLoss && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                    Khoản mục
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                    Kỳ này
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                    Kỳ trước
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                    Tăng trưởng
                  </th>
                </tr>
              </thead>
              <tbody>
                {profitLoss.lines.map((line, index) => (
                  <tr
                    key={index}
                    className={`border-b border-gray-100 dark:border-gray-700 ${
                      line.type === "subtotal" || line.type === "profit"
                        ? "bg-gray-50 font-semibold dark:bg-gray-700"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {line.label}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(line.currentPeriod)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                      {formatCurrency(line.previousPeriod)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        line.growth >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {line.growth >= 0 ? "+" : ""}
                      {line.growth.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: CASH BOOK */}
        {activeTab === "cashbook" && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                      Ngày
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                      Mã phiếu
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                      Loại
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                      Nội dung
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                      Đối tượng
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                      Số tiền
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                      Phương thức
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cashBook.length > 0 ? (
                    cashBook.map((entry, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                      >
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {entry.date}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">
                          {entry.code}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              entry.type === "receipt"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {entry.type === "receipt" ? "Thu" : "Chi"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {entry.description}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {entry.party}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-semibold ${
                            entry.type === "receipt"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {entry.type === "receipt" ? "+" : "-"}
                          {formatCurrency(entry.amount)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {entry.paymentMethod}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-600 dark:text-gray-400">
                        Không có giao dịch nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DEBT */}
        {activeTab === "debt" && (
          <div className="space-y-6">
            {/* Customer Debts */}
            <div>
              <h4 className="mb-3 font-semibold text-gray-900 dark:text-white">
                📥 Phải Thu Khách Hàng
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Mã KH
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Tên Khách
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        Nợ đầu kỳ
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        Phát sinh
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        Đã thu
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        Nợ cuối kỳ
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerDebts.length > 0 ? (
                      customerDebts.map((debt, index) => (
                        <tr
                          key={index}
                          className={`border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 ${
                            debt.overdue ? "bg-orange-50 dark:bg-orange-900/20" : ""
                          }`}
                        >
                          <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">
                            {debt.customerCode}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-900 dark:text-white">
                                {debt.customerName}
                              </span>
                              {debt.overdue && (
                                <AlertCircle className="h-4 w-4 text-orange-600" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                            {formatCurrency(debt.openingDebt)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                            {formatCurrency(debt.newDebt)}
                          </td>
                          <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                            {formatCurrency(debt.payments)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(debt.closingDebt)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {debt.overdue && (
                              <button
                                title="Gửi nhắc nợ"
                                className="inline-flex items-center gap-1 rounded bg-orange-100 px-2 py-1 text-xs hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800"
                              >
                                <Bell className="h-3 w-3" />
                                Nhắc
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-600 dark:text-gray-400">
                          Không có công nợ khách hàng
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Supplier Debts */}
            <div>
              <h4 className="mb-3 font-semibold text-gray-900 dark:text-white">
                📤 Phải Trả Nhà Cung Cấp
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Mã NCC
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                        Tên NCC
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        Phải trả đầu kỳ
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        Mua trong kỳ
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        Đã trả
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                        Phải trả cuối kỳ
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierDebts.length > 0 ? (
                      supplierDebts.map((debt, index) => (
                        <tr
                          key={index}
                          className={`border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 ${
                            debt.overdue ? "bg-red-50 dark:bg-red-900/20" : ""
                          }`}
                        >
                          <td className="px-4 py-3 font-mono text-gray-900 dark:text-white">
                            {debt.supplierCode}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-900 dark:text-white">
                                {debt.supplierName}
                              </span>
                              {debt.overdue && (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                            {formatCurrency(debt.openingPayable)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                            {formatCurrency(debt.purchasesInPeriod)}
                          </td>
                          <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                            {formatCurrency(debt.paymentsMade)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(debt.closingPayable)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {debt.overdue ? (
                              <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                                Quá hạn {debt.daysOverdue} ngày
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                                Bình thường
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-600 dark:text-gray-400">
                          Không có công nợ nhà cung cấp
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
