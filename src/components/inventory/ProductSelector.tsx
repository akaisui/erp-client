"use client";

import React, { useState, useMemo } from "react";
import { useProducts } from "@/hooks/api";
import { ApiResponse, Product } from "@/types";
import { useDebounce } from "@/hooks";

interface ProductSelectorProps {
  onSelect: (product: Product) => void;
  warehouseId?: number;
  excludeProductIds?: number[];
  checkStock?: boolean;
  label?: string;
  placeholder?: string;
}

export function ProductSelector({
  onSelect,
  warehouseId,
  excludeProductIds = [],
  checkStock = false,
  label = "Chọn sản phẩm",
  placeholder = "Tìm sản phẩm theo tên hoặc mã..."
}: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Fetch products
  const { data: productsResponseWrapper, isLoading } = useProducts({
    search: debouncedSearch,
    status: "active",
    limit: 50,
  });

  const productsResponse = productsResponseWrapper as unknown as ApiResponse<Product[]>;

  // Filter available products
  const availableProducts = useMemo(() => {
    if (!productsResponse?.data) return [];

    return productsResponse.data.filter((product) => {
      if (excludeProductIds.includes(product.id)) return false;

      if (checkStock && warehouseId && product.inventory) {
        const inventory = product.inventory.find((inv) => inv.warehouseId === warehouseId);
        if (!inventory || (inventory.quantity - inventory.reservedQuantity) <= 0) {
          return false;
        }
      }

      return true;
    });
  }, [productsResponse?.data, excludeProductIds, checkStock, warehouseId]);

  const handleSelect = (product: Product) => {
    onSelect(product);
    setSearchTerm("");
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>

      {/* Search Input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
          placeholder={placeholder}
        />
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && searchTerm && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Results */}
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700 max-h-80 overflow-auto">
            {availableProducts.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                    <span>Đang tìm kiếm...</span>
                  </div>
                ) : (
                  <div>
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="mt-2">Không tìm thấy sản phẩm</p>
                  </div>
                )}
              </div>
            ) : (
              <ul className="py-1">
                {availableProducts.map((product) => {
                  // Get inventory info if checking stock
                  const inventory = checkStock && warehouseId && product.inventory
                    ? product.inventory.find((inv) => inv.warehouseId === warehouseId)
                    : null;
                  const availableQty = inventory
                    ? inventory.quantity - inventory.reservedQuantity
                    : null;

                  return (
                    <li key={product.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(product)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-3"
                      >
                        {/* Product Image */}
                        {product.images?.[0]?.imageUrl ? (
                          <img
                            src={product.images[0].imageUrl}
                            alt={product.productName}
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <svg
                              className="h-6 w-6 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                          </div>
                        )}

                        {/* Product Info */}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {product.productName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {product.sku}
                            {product.unit && ` • ${product.unit}`}
                            {product.purchasePrice && (
                              <span className="ml-2 font-medium text-gray-700 dark:text-gray-300">
                                {Number(product.purchasePrice).toLocaleString("vi-VN")} đ
                              </span>
                            )}
                          </div>
                          {/* Available stock */}
                          {checkStock && availableQty !== null && (
                            <div className="mt-1 text-xs">
                              {availableQty > 0 ? (
                                <span className="text-green-600 dark:text-green-400">
                                  Tồn kho: {availableQty.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-red-600 dark:text-red-400">
                                  Hết hàng
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Select Icon */}
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
