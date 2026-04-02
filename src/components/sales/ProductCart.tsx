"use client";

import React, { useState, useMemo } from "react";
import { useProducts } from "@/hooks/api";
import { useInventoryByWarehouse } from "@/hooks/api/useInventory";
import { Product, CartItem, ApiResponse } from "@/types";
import type { CustomerClassification, InventoryByWarehouseResponse } from "@/types";
import { Search, Plus, Trash2, Package, AlertCircle, Lock } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface ProductCartProps {
  items: CartItem[];
  onAddItem: (product: Product, quantity?: number) => void;
  onRemoveItem: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onUpdatePrice: (productId: number, unitPrice: number) => void;
  onUpdateDiscount: (productId: number, discountPercent: number) => void;
  onUpdateTax: (productId: number, taxRate: number) => void;
  warehouseId?: number;
  disabled?: boolean;
  customerClassification?: CustomerClassification;
}

export default function ProductCart({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
  onUpdatePrice,
  onUpdateDiscount,
  onUpdateTax,
  warehouseId,
  disabled = false,
  customerClassification,
}: ProductCartProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Fetch inventory by warehouse
  const { data: inventoryData } = useInventoryByWarehouse(warehouseId || 0, !!warehouseId);
  const inventoryByWarehouse = (inventoryData as unknown as ApiResponse<InventoryByWarehouseResponse[]>)?.data || [];
  
  // Create map of product stock for quick lookup
  const stockByProductId = useMemo(() => {
    const map = new Map<number, number>();
    inventoryByWarehouse.forEach((inv) => {
      map.set(inv.productId, inv.availableQuantity);
    });
    return map;
  }, [inventoryByWarehouse]);

  const getPriceByClassification = (product: Product): number => {
    if (!customerClassification) return product.sellingPriceRetail || 0;
    
    switch (customerClassification) {
      case "retail":
        return product.sellingPriceRetail || 0;
      case "wholesale":
        return product.sellingPriceWholesale || product.sellingPriceRetail || 0;
      case "vip":
        return product.sellingPriceVip || product.sellingPriceWholesale || product.sellingPriceRetail || 0;
      case "distributor":
        return product.sellingPriceWholesale || product.sellingPriceRetail || 0;
      default:
        return product.sellingPriceRetail || 0;
    }
  };

  // Fetch products (finished_product và goods)
  const { data: finishedProductsData } = useProducts({
    productType: 'finished_product',
    status: "active",
    limit: 100
  });
  const finishedProducts = (finishedProductsData as unknown as ApiResponse<Product[]>)?.data || [];

  const { data: goodsData } = useProducts({
    productType: 'goods',
    status: "active",
    limit: 100
  });
  const goods = (goodsData as unknown as ApiResponse<Product[]>)?.data || [];

  // Combine products
  const allProducts = useMemo(() => {
    return [...finishedProducts, ...goods];
  }, [finishedProducts, goods]);

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return allProducts;

    const search = searchTerm.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.productName.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search)
    );
  }, [allProducts, searchTerm]);

  // Filter out already added products
  const availableProducts = useMemo(() => {
    const addedIds = new Set(items.map((item) => item.productId));
    return filteredProducts.filter((p) => !addedIds.has(p.id));
  }, [filteredProducts, items]);

  const handleAddProduct = (product: Product) => {
    const priceByClassification = getPriceByClassification(product);
    onAddItem(product, 1);
    // Update price to match customer classification
    if (priceByClassification !== (product.sellingPriceRetail || 0)) {
      setTimeout(() => {
        onUpdatePrice(product.id, priceByClassification);
      }, 0);
    }
    setSearchTerm("");
    setShowProductSearch(false);
  };

  // Get available stock for a product
  const getAvailableStock = (productId: number): number => {
    return stockByProductId.get(productId) || 0;
  };

  const isProductOutOfStock = (productId: number): boolean => {
    return getAvailableStock(productId) === 0;
  };

  // Calculate line totals
  const calculateLineTotal = (item: CartItem) => {
    const subtotal = (item.product.sellingPriceRetail || 0) * item.quantity;
    const discount = (subtotal * item.discountPercent) / 100;
    const taxableAmount = subtotal - discount;
    const tax = (taxableAmount * item.taxRate) / 100;
    return taxableAmount + tax;
  };

  return (
    <div className="space-y-4">
      {/* Warehouse Selection Warning */}
      {!warehouseId && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
              Chưa chọn kho xuất hàng
            </p>
            <p className="text-xs text-yellow-800 dark:text-yellow-300">
              Vui lòng chọn kho trước khi thêm sản phẩm để kiểm tra tồn kho
            </p>
          </div>
        </div>
      )}

      {/* Add Product Section */}
      {!disabled && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Thêm sản phẩm
            </h3>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm theo tên, SKU..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowProductSearch(true);
              }}
              onFocus={() => setShowProductSearch(true)}
              className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />

            {/* Product Search Dropdown */}
            {showProductSearch && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowProductSearch(false)}
                />
                <div className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {availableProducts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      {searchTerm
                        ? "Không tìm thấy sản phẩm"
                        : "Tất cả sản phẩm đã được thêm"}
                    </div>
                  ) : (
                    availableProducts.map((product) => {
                      const stock = getAvailableStock(product.id);
                      const outOfStock = isProductOutOfStock(product.id);
                      
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => !outOfStock && handleAddProduct(product)}
                          disabled={outOfStock}
                          className={`w-full border-b border-gray-200 p-3 text-left transition-colors ${
                            outOfStock
                              ? 'bg-gray-50 cursor-not-allowed opacity-60 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-900'
                              : 'hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700'
                          } dark:border-gray-700`}
                        >
                          <div className="flex items-center gap-3">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0].imageUrl}
                                alt={product.productName}
                                className={`h-12 w-12 rounded object-cover ${outOfStock ? 'opacity-50' : ''}`}
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
                                <Package className="h-6 w-6 text-gray-500" />
                              </div>
                            )}

                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className={`font-medium ${outOfStock ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                  {product.productName}
                                </p>
                                {outOfStock && (
                                  <Lock className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                SKU: {product.sku} • Đơn vị: {product.unit} • Thuế: {product.taxRate || 0}%
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                                  {formatCurrency(getPriceByClassification(product))}
                                </p>
                                <span className={`text-xs font-medium ${
                                  outOfStock
                                    ? 'text-red-600 dark:text-red-400'
                                    : stock < 10
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-green-600 dark:text-green-400'
                                }`}>
                                  {outOfStock ? 'Hết hàng' : `Tồn: ${formatNumber(stock)}`}
                                </span>
                              </div>
                            </div>

                            {!outOfStock && <Plus className="h-5 w-5 text-gray-400" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cart Items */}
      {items.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Chưa có sản phẩm nào. Tìm kiếm và thêm sản phẩm vào đơn hàng.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 dark:text-white">
                    Sản phẩm
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 dark:text-white">
                    Đơn giá
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 dark:text-white">
                    Số lượng
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 dark:text-white">
                    Giảm giá (%)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 dark:text-white">
                    Thuế (%)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 dark:text-white">
                    Thành tiền
                  </th>
                  {!disabled && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-900 dark:text-white">
                      Thao tác
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {items.map((item) => (
                  <tr key={item.productId}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0].imageUrl}
                            alt={item.product.productName}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
                            <Package className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.product.productName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.product.sku}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatCurrency(getPriceByClassification(item.product) || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {disabled ? (
                        <span className="text-sm text-gray-900 dark:text-white">
                          {formatNumber(item.quantity)} {item.product.unit}
                        </span>
                      ) : (
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') return;
                            onUpdateQuantity(item.productId, parseFloat(value) || item.quantity);
                          }}
                          min="0.01"
                          step="1"
                          className="
                            w-14 rounded border border-gray-300 py-1 px-2 text-right text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white
                          "
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {disabled ? (
                        <span className="text-sm text-gray-900 dark:text-white">
                          {item.discountPercent}%
                        </span>
                      ) : (
                        <input
                          type="number"
                          value={item.discountPercent}
                          onChange={(e) =>
                            onUpdateDiscount(item.productId, parseFloat(e.target.value) || 0)
                          }
                          min="0"
                          max="100"
                          step="1"
                          className="w-20 rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {disabled ? (
                        <span className="text-sm text-gray-900 dark:text-white">
                          {item.taxRate}%
                        </span>
                      ) : (
                        <input
                          type="number"
                          value={item.taxRate}
                          onChange={(e) =>
                            onUpdateTax(item.productId, parseFloat(e.target.value) || 0)
                          }
                          min="0"
                          max="100"
                          step="1"
                          className="w-20 rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(calculateLineTotal(item))}
                      </span>
                    </td>
                    {!disabled && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.productId)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Warning if no items */}
      {items.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Đơn hàng phải có ít nhất 1 sản phẩm
          </p>
        </div>
      )}
    </div>
  );
}
