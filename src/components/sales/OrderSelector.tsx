"use client";

import React, { useState, useMemo } from "react";
import { useSalesOrders } from "@/hooks/api";
import { SalesOrder, ApiResponse } from "@/types";
import { Search, ShoppingCart, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface OrderSelectorProps {
  customerId?: number | null;
  value?: number | undefined;
  onChange?: (orderId: number | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function OrderSelector({
  customerId,
  value,
  onChange,
  disabled = false,
  placeholder = "Chọn đơn hàng...",
}: OrderSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch orders for the selected customer
  const { data: ordersData, isLoading } = useSalesOrders(
    customerId ? { customerId } : undefined
  );
  const response = ordersData as unknown as ApiResponse<SalesOrder[]>;
  const allOrders = response?.data || [];

  // Sort orders by createdAt (newest first)
  const sortedOrders = useMemo(() => {
    const sorted = [...allOrders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted;
  }, [allOrders]);

  // Find selected order
  const selectedOrder = sortedOrders.find((o) => o.id === value) || null;

  // Filter orders by search
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return sortedOrders;

    const search = searchTerm.toLowerCase();
    return sortedOrders.filter(
      (o) =>
        o.orderCode?.toLowerCase().includes(search) ||
        o.orderStatus?.toLowerCase().includes(search)
    );
  }, [sortedOrders, searchTerm]);

  const handleSelect = (order: SalesOrder) => {
    onChange?.(order.id);
    setShowDropdown(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    onChange?.(undefined);
  };

  if (!customerId) {
    return (
      <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
        Vui lòng chọn khách hàng trước
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected Order Display */}
      {selectedOrder ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Đơn hàng đã chọn
            </h3>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                Thay đổi
              </button>
            )}
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                {selectedOrder.orderCode}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {format(new Date(selectedOrder.createdAt), "dd/MM/yyyy")}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Tổng tiền: {formatCurrency(selectedOrder.totalAmount || 0)}
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {selectedOrder.orderStatus}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mã đơn hàng (tùy chọn)
          </label>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={placeholder}
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
              <div className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Đang tải...
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Không tìm thấy đơn hàng
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => handleSelect(order)}
                      className="w-full border-b border-gray-200 p-3 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {order.orderCode}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(order.createdAt), "dd/MM/yyyy")}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {formatCurrency(order.totalAmount || 0)} • {order.orderStatus}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
