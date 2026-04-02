import React from "react";
import { AlertTriangle, TrendingDown, Package, DollarSign } from "lucide-react";
import type { WastageReport } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { MATERIAL_TYPE_LABELS } from "@/lib/constants";

interface WastageReportProps {
  report: WastageReport;
}

export function WastageReportComponent({ report }: WastageReportProps) {
  console.log('report', report);
  const hasWastage = report.totalWastageCost > 0;
  const efficiencyPercentage = Number(report.efficiencyRate); // Already a percentage (0-100)
  const quantityDifference = report.finishedProduct.actualQuantity - report.finishedProduct.plannedQuantity;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Efficiency Rate */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tỷ lệ hiệu suất
              </p>
              <p className={`mt-1 text-2xl font-bold ${
                efficiencyPercentage >= 95
                  ? "text-green-600 dark:text-green-400"
                  : efficiencyPercentage >= 90
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
                {efficiencyPercentage.toFixed(2)}%
              </p>
            </div>
            <div className={`rounded-full p-3 ${
              efficiencyPercentage >= 95
                ? "bg-green-100 dark:bg-green-900/30"
                : efficiencyPercentage >= 90
                ? "bg-yellow-100 dark:bg-yellow-900/30"
                : "bg-red-100 dark:bg-red-900/30"
            }`}>
              <TrendingDown className={`h-6 w-6 ${
                efficiencyPercentage >= 95
                  ? "text-green-600 dark:text-green-400"
                  : efficiencyPercentage >= 90
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-600 dark:text-red-400"
              }`} />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Tỷ lệ đạt được so với kế hoạch
          </p>
        </div>

        {/* Quantity Difference */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chênh lệch số lượng
              </p>
              <p className={`mt-1 text-2xl font-bold ${
                quantityDifference >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}>
                {quantityDifference >= 0 ? "+" : ""}
                {formatNumber(quantityDifference)}
              </p>
            </div>
            <div className={`rounded-full p-3 ${
              quantityDifference >= 0
                ? "bg-green-100 dark:bg-green-900/30"
                : "bg-red-100 dark:bg-red-900/30"
            }`}>
              <Package className={`h-6 w-6 ${
                quantityDifference >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`} />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Kế hoạch: {formatNumber(report.finishedProduct.plannedQuantity)} | Thực tế: {formatNumber(report.finishedProduct.actualQuantity)}
          </p>
        </div>

        {/* Total Wastage Value */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Giá trị hao hụt
              </p>
              <p className={`mt-1 text-2xl font-bold ${
                hasWastage
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`}>
                {formatCurrency(report.totalWastageCost)}
              </p>
            </div>
            <div className={`rounded-full p-3 ${
              hasWastage
                ? "bg-red-100 dark:bg-red-900/30"
                : "bg-green-100 dark:bg-green-900/30"
            }`}>
              <DollarSign className={`h-6 w-6 ${
                hasWastage
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`} />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Tổng chi phí hao hụt nguyên liệu
          </p>
        </div>
      </div>

      {/* Warning if low efficiency */}
      {efficiencyPercentage < 90 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-200">
                Cảnh báo hiệu suất thấp
              </h4>
              <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-300">
                Tỷ lệ hiệu suất sản xuất thấp hơn 90%. Vui lòng kiểm tra lại quy trình sản xuất
                và nguyên nhân hao hụt.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Material Wastage Details */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Chi tiết hao hụt nguyên liệu
        </h3>
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Nguyên liệu
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  KH
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Thực tế
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Hao hụt
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  % Hao hụt
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Đơn giá
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Giá trị HH
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {report.wastageDetails.map((material, index) => {
                const hasWastage = material.wastageAmount > 0;
                return (
                  <tr
                    key={index}
                    className={hasWastage ? "bg-red-50 dark:bg-red-900/10" : ""}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {material.materialName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {MATERIAL_TYPE_LABELS[material.materialType]}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-gray-900 dark:text-white">
                        {formatNumber(material.plannedQuantity)}
                      </span>
                      <span className="ml-1 text-xs text-gray-500">
                        {material.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-gray-900 dark:text-white">
                        {formatNumber(material.actualQuantity)}
                      </span>
                      <span className="ml-1 text-xs text-gray-500">
                        {material.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-medium ${
                          hasWastage
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {formatNumber(material.wastageAmount)}
                      </span>
                      <span className="ml-1 text-xs text-gray-500">
                        {material.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-medium ${
                          material.wastagePercentage > 10
                            ? "text-red-600 dark:text-red-400"
                            : material.wastagePercentage > 5
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {material.wastagePercentage.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                      {formatCurrency(material.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-medium ${
                          hasWastage
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {formatCurrency(material.wastageCost)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white"
                >
                  Tổng giá trị hao hụt:
                </td>
                <td className="px-4 py-3 text-right text-lg font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(report.totalWastageCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
