"use client";

import React from "react";
import Link from "next/link";
import { useTopProducts } from "@/hooks/api";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { TrendingUp, Award } from "lucide-react";

interface TopProductsTableProps {
  initialData?: any[];
}

export function TopProductsTable({ initialData }: TopProductsTableProps) {
  const { data: fetchedProducts, isLoading } = useTopProducts(10);
  const rawProducts = initialData || fetchedProducts;
  const products = Array.isArray(rawProducts) ? rawProducts : rawProducts?.data || [];

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sản phẩm bán chạy
          </h3>
        </div>
        <Link
          href="/reports/products"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Xem báo cáo →
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                #
              </th>
              <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                Sản phẩm
              </th>
              <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                SKU
              </th>
              <th className="pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                Đã bán
              </th>
              <th className="pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                Doanh thu
              </th>
              <th className="pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                Giá trung bình
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3">
                    <div className="h-4 w-6 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                  <td className="py-3">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                  <td className="py-3">
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="ml-auto h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="ml-auto h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="ml-auto h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                  </td>
                </tr>
              ))
            ) : products && products.length > 0 ? (
              products.map((product, index) => (
                <tr
                  key={product.productId}
                  className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                >
                  <td className="py-3">
                    <div className="flex items-center justify-center">
                      {index === 0 ? (
                        <Award className="h-5 w-5 text-yellow-500" />
                      ) : index === 1 ? (
                        <Award className="h-5 w-5 text-gray-400" />
                      ) : index === 2 ? (
                        <Award className="h-5 w-5 text-amber-600" />
                      ) : (
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {index + 1}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/inventory/products/${product.productId}`}
                      className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {product.productName}
                    </Link>
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">
                    {product.sku}
                  </td>
                  <td className="py-3 text-right font-medium text-gray-900 dark:text-white">
                    {formatNumber(product.quantitySold)}
                  </td>
                  <td className="py-3 text-right font-medium text-gray-900 dark:text-white">
                    {formatCurrency(product.revenue || 0)}
                  </td>
                  <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                    {formatCurrency((product.revenue || 0) / (product.quantitySold || 1))}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                  Chưa có dữ liệu bán hàng
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
