"use client";

import React, { useState } from "react";
import { useCalculateMaterials } from "@/hooks/api";
import Button from "@/components/ui/button/Button";
import { Calculator, Package, DollarSign, TrendingUp } from "lucide-react";
import { BOM_MATERIAL_TYPE_LABELS } from "@/lib/constants";
import { CalculateMaterialsResult } from "@/types";

interface BOMCalculatorProps {
  bomId: number;
  bomCode: string;
  outputQuantityPerBatch: number;
  finishedProductUnit: string;
}

export default function BOMCalculator({
  bomId,
  bomCode,
  outputQuantityPerBatch,
  finishedProductUnit,
}: BOMCalculatorProps) {
  const [productionQuantity, setProductionQuantity] = useState<number>(outputQuantityPerBatch);
  const [showResults, setShowResults] = useState(false);

  const calculateMaterials = useCalculateMaterials();

  // Handle Calculate
  const handleCalculate = async () => {
    if (!productionQuantity || productionQuantity <= 0) {
      alert("Vui lòng nhập số lượng sản xuất hợp lệ!");
      return;
    }

    try {
      await calculateMaterials.mutateAsync({
        bomId,
        productionQuantity,
      });
      setShowResults(true);
    } catch (error) {
      console.error("Calculate error:", error);
      setShowResults(false);
    }
  };

  console.log("Calculate Materials Result:", calculateMaterials);

  const result = calculateMaterials.data?.data as unknown as CalculateMaterialsResult;

  // Separate materials by type
  const rawMaterials = result?.materials?.filter((m) => m.materialType === "raw_material") || [];
  const packagingMaterials = result?.materials?.filter((m) => m.materialType === "packaging") || [];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Calculator Header */}
      <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Máy tính nguyên liệu</h3>
            <p className="text-sm text-blue-100">
              Tính toán nguyên liệu cần thiết cho BOM {bomCode}
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sản lượng mỗi mẻ
            </label>
            <div className="rounded-lg bg-gray-50 px-4 py-2 dark:bg-gray-700">
              <p className="text-sm text-gray-900 dark:text-white">
                {formatNumber(outputQuantityPerBatch)} {finishedProductUnit}
              </p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Số lượng cần sản xuất <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={productionQuantity}
                onChange={(e) => setProductionQuantity(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                placeholder="Nhập số lượng..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <div className="flex items-center rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 dark:border-gray-600 dark:bg-gray-700">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {finishedProductUnit}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button
            variant="primary"
            size="md"
            onClick={handleCalculate}
            disabled={calculateMaterials.isPending || !productionQuantity}
            className="w-full md:w-auto"
          >
            {calculateMaterials.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Đang tính toán...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Tính toán
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Results Section */}
      {showResults && result && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Số mẻ</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatNumber(result.batchCount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hiệu suất</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {result.efficiencyRate}%
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tổng chi phí</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(result.totalEstimatedCost)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                  <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Chi phí/đơn vị</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(result.costPerUnit)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Raw Materials Table */}
          {rawMaterials.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {BOM_MATERIAL_TYPE_LABELS.raw_material} ({rawMaterials.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                        Nguyên liệu
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                        SL/mẻ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                        Tổng SL cần
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                        Đơn giá
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {rawMaterials.map((material, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {material.materialName}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">
                              {material.materialSku}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 dark:text-white">
                          {formatNumber(material.baseQuantityPerBatch)} {material.unit}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                          {formatNumber(material.totalQuantityNeeded)} {material.unit}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 dark:text-white">
                          {formatCurrency(material.unitPrice)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(material.estimatedCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Packaging Materials Table */}
          {packagingMaterials.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {BOM_MATERIAL_TYPE_LABELS.packaging} ({packagingMaterials.length})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                        Bao bì
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                        SL/mẻ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                        Tổng SL cần
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                        Đơn giá
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {packagingMaterials.map((material, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {material.materialName}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">
                              {material.materialSku}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 dark:text-white">
                          {formatNumber(material.baseQuantityPerBatch)} {material.unit}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                          {formatNumber(material.totalQuantityNeeded)} {material.unit}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900 dark:text-white">
                          {formatCurrency(material.unitPrice)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(material.estimatedCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Total Summary */}
          <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100 p-6 dark:border-gray-700 dark:from-blue-900/20 dark:to-blue-800/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tổng chi phí ước tính cho {formatNumber(productionQuantity)}{" "}
                  {finishedProductUnit}
                </p>
                <p className="mt-1 text-3xl font-bold text-blue-900 dark:text-blue-300">
                  {formatCurrency(result.totalEstimatedCost)}
                </p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Chi phí trên mỗi {finishedProductUnit}:{" "}
                  <span className="font-semibold">{formatCurrency(result.costPerUnit)}</span>
                </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-900 dark:text-yellow-300">
              <strong>Lưu ý:</strong> Đây là chi phí ước tính dựa trên đơn giá hiện tại của
              nguyên liệu. Chi phí thực tế có thể thay đổi tùy thuộc vào giá mua và tỷ lệ hao
              hụt thực tế trong quá trình sản xuất.
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {calculateMaterials.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
          <p className="text-sm text-red-900 dark:text-red-300">
            <strong>Lỗi:</strong>{" "}
            {(calculateMaterials.error as any)?.error?.message ||
              (calculateMaterials.error as any)?.message ||
              "Không thể tính toán. Vui lòng thử lại!"}
          </p>
        </div>
      )}
    </div>
  );
}
