"use client";

// Customer Selector Component
// Component để search và chọn khách hàng khi tạo đơn hàng
// Hiển thị thông tin công nợ và cảnh báo nếu vượt hạn mức

import React, { useState, useMemo } from "react";
import { useCustomers } from "@/hooks/api";
import { Customer, ApiResponse } from "@/types";
import { Search, User, AlertTriangle, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CUSTOMER_TYPE_LABELS, CUSTOMER_CLASSIFICATION_LABELS } from "@/lib/constants";

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer) => void;
  disabled?: boolean;
}

export default function CustomerSelector({
  selectedCustomer,
  onSelect,
  disabled = false,
}: CustomerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch customers
  const { data, isLoading } = useCustomers({ status: "active" });
  const response = data as unknown as ApiResponse<Customer[]>;
  const customers = response?.data || [];

  // Filter customers by search
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;

    const search = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.customerName.toLowerCase().includes(search) ||
        c.customerCode.toLowerCase().includes(search) ||
        c.phone.toLowerCase().includes(search)
    );
  }, [customers, searchTerm]);

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    setShowDropdown(false);
    setSearchTerm("");
  };

  // Calculate debt status
  const getDebtStatus = (customer: Customer) => {
    if (customer.creditLimit === 0) return "no_limit";
    const percentage = (customer.currentDebt / customer.creditLimit) * 100;
    if (percentage >= 100) return "over_limit";
    if (percentage >= 80) return "warning";
    return "safe";
  };

  return (
    <div className="space-y-4">
      {/* Selected Customer Display */}
      {selectedCustomer ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Khách hàng đã chọn
            </h3>
            {!disabled && (
              <button
                type="button"
                onClick={() => onSelect(null!)}
                className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                Thay đổi
              </button>
            )}
          </div>

          <div className="flex items-start gap-3">
            {selectedCustomer.avatarUrl ? (
              <img
                src={selectedCustomer.avatarUrl}
                alt={selectedCustomer.customerName}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
            )}

            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                {selectedCustomer.customerName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedCustomer.customerCode} • {selectedCustomer.phone}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {CUSTOMER_TYPE_LABELS[selectedCustomer.customerType]} •{" "}
                {CUSTOMER_CLASSIFICATION_LABELS[selectedCustomer.classification]}
              </p>
            </div>
          </div>

          {/* Debt Information */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Công nợ hiện tại</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(selectedCustomer.currentDebt)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Hạn mức</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(selectedCustomer.creditLimit)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Còn lại</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(
                  Math.max(0, selectedCustomer.creditLimit - selectedCustomer.currentDebt)
                )}
              </span>
            </div>

            {/* Debt Status Indicator */}
            {(() => {
              const status = getDebtStatus(selectedCustomer);
              if (status === "over_limit") {
                return (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-400" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                        Vượt hạn mức công nợ
                      </p>
                      <p className="text-xs text-red-800 dark:text-red-300">
                        Khách hàng đã vượt hạn mức. Không thể tạo đơn hàng trả sau.
                      </p>
                    </div>
                  </div>
                );
              }
              if (status === "warning") {
                return (
                  <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
                        Gần đạt hạn mức
                      </p>
                      <p className="text-xs text-yellow-800 dark:text-yellow-300">
                        Công nợ đã vượt 80% hạn mức. Cần thận trọng khi tạo đơn.
                      </p>
                    </div>
                  </div>
                );
              }
              if (status === "safe") {
                return (
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-2 dark:border-green-800 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-900 dark:text-green-200">
                      Công nợ trong hạn mức
                    </p>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      ) : (
        <div className="relative">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Chọn khách hàng <span className="text-red-500">*</span>
          </label>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm khách hàng theo tên, mã, SĐT..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              disabled={disabled}
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Dropdown */}
          {showDropdown && !disabled && (
            <>
              {/* Overlay to close dropdown */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />

              {/* Results */}
              <div className="absolute z-20 mt-1 max-h-96 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Đang tải...
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Không tìm thấy khách hàng
                  </div>
                ) : (
                  filteredCustomers.map((customer) => {
                    const status = getDebtStatus(customer);
                    return (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleSelect(customer)}
                        className="w-full border-b border-gray-200 p-3 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          {customer.avatarUrl ? (
                            <img
                              src={customer.avatarUrl}
                              alt={customer.customerName}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                              <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {customer.customerName}
                              </p>
                              {status === "over_limit" && (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              )}
                              {status === "warning" && (
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {customer.customerCode} • {customer.phone}
                            </p>
                            <p className="text-xs text-gray-500">
                              Công nợ: {formatCurrency(customer.currentDebt)} /{" "}
                              {formatCurrency(customer.creditLimit)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
