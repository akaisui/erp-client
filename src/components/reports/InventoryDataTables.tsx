"use client";

import React, { useState } from "react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

interface InventoryDataTablesProps {
  data: {
    inventoryStatus: Array<{
      sku: string;
      productName: string;
      warehouse: string;
      unit: string;
      onHand: number;
      reserved: number;
      available: number;
      minStockLevel: number;
      totalValue: number;
      status: string;
    }>;
    stockFlowTable: Array<{
      sku: string;
      productName: string;
      beginningQuantity: number;
      importQuantity: number;
      exportQuantity: number;
      endingQuantity: number;
    }>;
    batchExpiry: Array<any>;
  } | null;
  isLoading?: boolean;
}

export default function InventoryDataTables({ data, isLoading = false }: InventoryDataTablesProps) {
  const [activeTab, setActiveTab] = useState<"status" | "flow" | "batch">("status");

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700" />;
  }

  if (!data) return null;

  const tabs = [
    { id: "status", label: "Tổng hợp Tồn kho", count: data.inventoryStatus?.length || 0 },
    { id: "flow", label: "Nhập - Xuất - Tồn", count: data.stockFlowTable?.length || 0 },
    { id: "batch", label: "Lô & Hạn sử dụng", count: data.batchExpiry?.length || 0 },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "safe":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "low_stock":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "out_of_stock":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "safe":
        return "An toàn";
      case "low_stock":
        return "Thấp";
      case "out_of_stock":
        return "Hết hàng";
      default:
        return status;
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Tab 1: Inventory Status */}
        {activeTab === "status" && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Mã SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tên sản phẩm
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Kho
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    ĐVT
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    On-hand
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Giữ
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Khả dụng
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Định mức
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Giá trị tồn
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {data.inventoryStatus?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {item.sku}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.productName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {item.warehouse}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                      {item.unit}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                      {formatNumber(item.onHand)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                      {formatNumber(item.reserved)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                      {formatNumber(item.available)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                      {formatNumber(item.minStockLevel)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.totalValue)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Stock Flow */}
        {activeTab === "flow" && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Mã hàng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tên hàng
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tồn đầu kỳ
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Nhập trong kỳ
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Xuất trong kỳ
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tồn cuối kỳ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {data.stockFlowTable?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {item.sku}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.productName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                      {formatNumber(item.beginningQuantity)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">
                      {formatNumber(item.importQuantity)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-red-600 dark:text-red-400">
                      {formatNumber(item.exportQuantity)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                      {formatNumber(item.endingQuantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Batch & Expiry */}
        {activeTab === "batch" && (
          <div className="flex items-center justify-center py-8 text-gray-600 dark:text-gray-400">
            <p>Không có dữ liệu lô hàng (cần tracking batch chi tiết từ StockTransactionDetail)</p>
          </div>
        )}
      </div>
    </div>
  );
}
