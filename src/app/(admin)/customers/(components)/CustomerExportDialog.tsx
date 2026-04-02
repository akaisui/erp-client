"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { Download, X, FileSpreadsheet } from "lucide-react";
import { Customer } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_CLASSIFICATION_LABELS,
  CUSTOMER_STATUS_LABELS,
} from "@/lib/constants";

interface CustomerExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[]; // Dữ liệu khách hàng cần xuất
  onConfirm: () => void; // Hàm thực hiện xuất Excel thật sự
}

export function CustomerExportDialog({
  isOpen,
  onClose,
  customers,
  onConfirm,
}: CustomerExportDialogProps) {
  
  // Hàm helper hiển thị màu sắc trạng thái
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "inactive": return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      case "locked": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="!max-w-none w-[90vw] h-[85vh] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Xem trước danh sách xuất Excel
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tổng cộng: <span className="font-semibold">{customers.length}</span> khách hàng
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Table Preview */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã KH</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên khách hàng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điện thoại</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Công nợ</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hạn mức</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {customers.map((customer, index) => (
                  <tr key={customer.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {customer.customerCode}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {customer.customerName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {customer.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {CUSTOMER_TYPE_LABELS[customer.customerType]} - {CUSTOMER_CLASSIFICATION_LABELS[customer.classification]}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${
                      (customer.currentDebt || 0) > 0 ? "text-red-600" : "text-gray-700 dark:text-gray-300"
                    }`}>
                      {formatCurrency(customer.currentDebt || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                      {formatCurrency(customer.creditLimit || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold leading-5 ${getStatusColor(customer.status)}`}>
                        {CUSTOMER_STATUS_LABELS[customer.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
        <Button variant="outline" onClick={onClose}>
          Hủy bỏ
        </Button>
        <Button variant="success" onClick={onConfirm}>
          <Download className="mr-2 h-4 w-4" />
          Xác nhận xuất Excel
        </Button>
      </div>
    </Modal>
  );
}