"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useWarehouses,
  useInventoryByWarehouse,
  useCreateStocktakeTransaction,
} from "@/hooks/api";
import Button from "@/components/ui/button/Button";
import { ArrowLeft, Search } from "lucide-react";
import type { Inventory } from "@/types";

const stocktakeSchema = z.object({
  warehouseId: z.number().int().positive("Vui lòng chọn kho"),
  reason: z.string().optional(),
  notes: z.string().optional(),
  details: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        systemQuantity: z.number().min(0),
        actualQuantity: z.number().min(0, "Số lượng thực tế phải >= 0"),
        batchNumber: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .min(1, "Phải kiểm đếm ít nhất 1 sản phẩm"),
});

type StocktakeFormData = z.infer<typeof stocktakeSchema>;

interface StocktakeItem extends Inventory {
  actualQuantity: number;
  itemNotes: string;
}

export default function StocktakeTransactionPage() {
  const router = useRouter();
  const { data: warehousesResponse } = useWarehouses();
  const createStocktake = useCreateStocktakeTransaction();

  const warehouses = warehousesResponse?.data || [];

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);

  // Fetch inventory for selected warehouse
  const { data: inventoryResponse, isLoading: inventoryLoading } =
    useInventoryByWarehouse(selectedWarehouseId || 0, !!selectedWarehouseId);

  const inventoryItems = inventoryResponse?.data || [];

  // Initialize stocktake items with actual quantity = system quantity
  const [stocktakeItems, setStocktakeItems] = useState<StocktakeItem[]>([]);

  // Update stocktake items when inventory loads
  React.useEffect(() => {
    if (inventoryItems.length > 0) {
      setStocktakeItems(
        inventoryItems.map((item) => ({
          ...item,
          actualQuantity: Number(item.quantity), // Default to system quantity
          itemNotes: "",
        }))
      );
    }
  }, [inventoryItems]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StocktakeFormData>({
    resolver: zodResolver(stocktakeSchema),
    defaultValues: {
      reason: "Kiểm kê định kỳ",
    },
  });

  // Filter items by search term
  const filteredItems = useMemo(() => {
    let items = stocktakeItems;

    // Search filter
    if (searchTerm) {
      items = items.filter(
        (item) =>
          item.product?.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Show only differences filter
    if (showOnlyDifferences) {
      items = items.filter((item) => item.actualQuantity !== Number(item.quantity));
    }

    return items;
  }, [stocktakeItems, searchTerm, showOnlyDifferences]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalItems = stocktakeItems.length;
    const itemsWithDifference = stocktakeItems.filter(
      (item) => item.actualQuantity !== Number(item.quantity)
    ).length;

    const totalDifference = stocktakeItems.reduce((sum, item) => {
      return sum + (item.actualQuantity - Number(item.quantity));
    }, 0);

    const totalIncrease = stocktakeItems.reduce((sum, item) => {
      const diff = item.actualQuantity - Number(item.quantity);
      return diff > 0 ? sum + diff : sum;
    }, 0);

    const totalDecrease = stocktakeItems.reduce((sum, item) => {
      const diff = item.actualQuantity - Number(item.quantity);
      return diff < 0 ? sum + Math.abs(diff) : sum;
    }, 0);

    return {
      totalItems,
      itemsWithDifference,
      totalDifference,
      totalIncrease,
      totalDecrease,
    };
  }, [stocktakeItems]);

  const handleWarehouseChange = (warehouseId: number) => {
    setSelectedWarehouseId(warehouseId);
    setStocktakeItems([]);
    setSearchTerm("");
    setShowOnlyDifferences(false);
  };

  const handleActualQuantityChange = (inventoryId: number, actualQuantity: number) => {
    setStocktakeItems((prev) =>
      prev.map((item) =>
        item.id === inventoryId ? { ...item, actualQuantity } : item
      )
    );
  };

  const handleItemNotesChange = (inventoryId: number, notes: string) => {
    setStocktakeItems((prev) =>
      prev.map((item) =>
        item.id === inventoryId ? { ...item, itemNotes: notes } : item
      )
    );
  };

  const onSubmit = async (data: Omit<StocktakeFormData, 'details'>) => {
    if (!selectedWarehouseId) {
      return;
    }

    // Only include items that have been checked (with difference or explicitly set)
    const details = stocktakeItems.map((item) => ({
      productId: item.productId,
      systemQuantity: Number(item.quantity),
      actualQuantity: item.actualQuantity,
      batchNumber: "",
      notes: item.itemNotes || undefined,
    }));

    try {
      await createStocktake.mutateAsync({
        warehouseId: selectedWarehouseId,
        reason: data.reason,
        notes: data.notes,
        details,
      });
      router.push("/inventory/transactions");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getDifferenceColor = (difference: number) => {
    if (difference === 0) return "text-gray-600 dark:text-gray-400";
    if (difference > 0) return "text-green-600 dark:text-green-400";
    return "text-red-600 dark:text-red-400";
  };

  const getDifferenceBgColor = (difference: number) => {
    if (difference === 0) return "";
    if (difference > 0) return "bg-green-50 dark:bg-green-900/10";
    return "bg-red-50 dark:bg-red-900/10";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Kiểm kê tồn kho
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Kiểm đếm và đối chiếu số lượng thực tế với hệ thống
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Warehouse Selection */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Chọn kho kiểm kê
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kho *
                </label>
                <select
                  value={selectedWarehouseId || ""}
                  onChange={(e) => handleWarehouseChange(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">-- Chọn kho --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.warehouseName} ({w.warehouseCode})
                    </option>
                  ))}
                </select>
                {errors.warehouseId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.warehouseId.message}
                  </p>
                )}
              </div>
            </div>

            {/* Inventory Items */}
            {selectedWarehouseId && (
              <>
                {/* Search & Filter */}
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Search */}
                    <div className="relative flex-1">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm sản phẩm theo tên hoặc mã SKU..."
                        className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>

                    {/* Filter */}
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={showOnlyDifferences}
                        onChange={(e) => setShowOnlyDifferences(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Chỉ hiện có chênh lệch
                    </label>
                  </div>
                </div>

                {/* Table */}
                {inventoryLoading ? (
                  <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    <svg
                      className="mb-4 h-12 w-12"
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
                    <p className="text-sm">
                      {searchTerm || showOnlyDifferences
                        ? "Không tìm thấy sản phẩm"
                        : "Kho không có sản phẩm"}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              #
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Sản phẩm
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              SL Hệ thống
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              SL Thực tế
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Chênh lệch
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Ghi chú
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                          {filteredItems.map((item, index) => {
                            const difference = item.actualQuantity - Number(item.quantity);
                            const hasDifference = difference !== 0;

                            return (
                              <tr
                                key={item.id}
                                className={`${
                                  hasDifference ? getDifferenceBgColor(difference) : ""
                                }`}
                              >
                                {/* Index */}
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                  {index + 1}
                                </td>

                                {/* Product */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    {item.product?.imageUrl ? (
                                      <img
                                        src={item.product.imageUrl}
                                        alt={item.product.productName}
                                        className="h-10 w-10 rounded object-cover"
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
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
                                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                          />
                                        </svg>
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                                        {item.product?.productName}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {item.product?.sku}
                                        {item.product?.unit && ` • ${item.product.unit}`}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* System Quantity */}
                                <td className="px-4 py-3 text-right">
                                  <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-sm font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                    {Number(item.quantity).toLocaleString()}
                                  </span>
                                </td>

                                {/* Actual Quantity */}
                                <td className="px-4 py-3 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={item.actualQuantity}
                                    onChange={(e) =>
                                      handleActualQuantityChange(
                                        item.id,
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className={`block w-24 ml-auto rounded-lg border px-3 py-1.5 text-right text-sm font-semibold focus:outline-none focus:ring-2 ${
                                      hasDifference
                                        ? "border-yellow-500 bg-yellow-50 text-yellow-900 focus:ring-yellow-500 dark:border-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
                                        : "border-gray-300 bg-white text-gray-900 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    }`}
                                  />
                                </td>

                                {/* Difference */}
                                <td className="px-4 py-3 text-right">
                                  <span
                                    className={`inline-flex items-center text-sm font-bold ${getDifferenceColor(
                                      difference
                                    )}`}
                                  >
                                    {difference > 0 && "+"}
                                    {difference.toLocaleString()}
                                  </span>
                                </td>

                                {/* Notes */}
                                <td className="px-4 py-3">
                                  <input
                                    type="text"
                                    value={item.itemNotes}
                                    onChange={(e) =>
                                      handleItemNotesChange(item.id, e.target.value)
                                    }
                                    placeholder="Lý do..."
                                    className="block w-full rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Thông tin bổ sung
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Lý do kiểm kê
                      </label>
                      <input
                        type="text"
                        {...register("reason")}
                        placeholder="VD: Kiểm kê định kỳ tháng 12"
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ghi chú chung
                      </label>
                      <textarea
                        {...register("notes")}
                        placeholder="Thông tin về đợt kiểm kê, người tham gia, v.v..."
                        rows={3}
                        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Summary Sidebar */}
          <div>
            <div className="sticky top-6 space-y-4">
              {/* Statistics Card */}
              {selectedWarehouseId && stocktakeItems.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Thống kê
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Tổng sản phẩm:
                      </span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {stats.totalItems}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Có chênh lệch:
                      </span>
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                        {stats.itemsWithDifference}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Tăng:
                      </span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        +{stats.totalIncrease.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Giảm:
                      </span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        -{stats.totalDecrease.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Chênh lệch ròng:
                      </span>
                      <span
                        className={`text-lg font-bold ${getDifferenceColor(
                          stats.totalDifference
                        )}`}
                      >
                        {stats.totalDifference > 0 && "+"}
                        {stats.totalDifference.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Card */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
                <div className="flex gap-2">
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-xs text-blue-800 dark:text-blue-300">
                    <p className="font-semibold mb-2">Hướng dẫn kiểm kê:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Nhập số lượng thực tế đếm được</li>
                      <li>Hệ thống tự động tính chênh lệch</li>
                      <li>Ghi chú lý do nếu có chênh lệch lớn</li>
                      <li>Tồn kho sẽ cập nhật sau khi phê duyệt</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={
                    isSubmitting || !selectedWarehouseId || stocktakeItems.length === 0
                  }
                  isLoading={isSubmitting}
                >
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  Tạo phiếu kiểm kê
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.back()}
                >
                  Hủy
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
