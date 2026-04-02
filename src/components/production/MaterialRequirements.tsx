import React from "react";
import { AlertCircle, CheckCircle, Package } from "lucide-react";
import type { ProductionOrderMaterial, MaterialShortage } from "@/types";
import { MATERIAL_TYPE_LABELS } from "@/lib/constants";
import { formatCurrency, formatNumber } from "@/lib/utils";
import Link from "next/link";

interface MaterialRequirementsProps {
  materials: ProductionOrderMaterial[];
  shortages?: MaterialShortage[];
  showActual?: boolean;
  showWastage?: boolean;
  showAvailability?: boolean;
  status?: "pending" | "in_progress" | "completed";
}

export function MaterialRequirements({
  materials,
  shortages = [],
  showActual = false,
  showWastage = false,
  showAvailability = false,
  status = "pending",
}: MaterialRequirementsProps) {
  const hasShortages = shortages.length > 0;
  
  // Auto-determine visibility based on status
  const effectiveShowAvailability = status === "pending" ? true : showAvailability;
  const effectiveShowActual = status !== "pending" ? true : showActual;
  const effectiveShowWastage = status === "completed" ? true : showWastage;

  // Group materials by type
  const rawMaterials = materials.filter((m) => m.materialType === "raw_material");
  const packaging = materials.filter((m) => m.materialType === "packaging");

  const renderMaterialRow = (material: ProductionOrderMaterial) => {
    const shortage = shortages.find((s) => s.materialId === material.materialId);
    const isShortage = !!shortage;

    console.log('material', material);

    return (
      <tr
        key={material.id || material.materialId}
        className={`border-b border-gray-200 dark:border-gray-700 ${
          isShortage ? "bg-red-50 dark:bg-red-900/10" : ""
        }`}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-400" />
            <div>
              {material.materialType === "raw_material" ? (
                <Link 
                  className="font-medium text-blue-600 dark:text-white hover:underline" 
                  href={`/materials/${material.materialId}`}
                >
                  {material.material?.productName || `Material #${material.materialId}`}
                </Link>
              ) : (
                <Link 
                  className="font-medium text-blue-600 dark:text-white hover:underline" 
                  href={`/packaging/${material.materialId}`}
                >
                  {material.material?.productName || `Material #${material.materialId}`}
                </Link>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {MATERIAL_TYPE_LABELS[material.materialType]}
              </p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          <span className="font-medium text-gray-900 dark:text-white">
            {formatNumber(material.plannedQuantity)}
          </span>
          <span className="ml-1 text-sm text-gray-500">
            {material.material?.unit || ""}
          </span>
        </td>
        {effectiveShowAvailability && (
          <td className="px-4 py-3 text-right">
            <span className="font-medium text-gray-900 dark:text-white">
              {material.material?.currentQuantity ? formatNumber(material.material.currentQuantity) : "—"}
            </span>
            <span className="ml-1 text-sm text-gray-500">
              {material.material?.unit || ""}
            </span>
          </td>
        )}
        {effectiveShowActual && (
          <td className="px-4 py-3 text-right">
            <span className="font-medium text-gray-900 dark:text-white">
              {formatNumber(material.actualQuantity || 0)}
            </span>
            <span className="ml-1 text-sm text-gray-500">
              {material.material?.unit || ""}
            </span>
          </td>
        )}
        {effectiveShowWastage && (
          <td className="px-4 py-3 text-right">
            <div className="flex flex-col items-end">
              <span
                className={`font-medium ${
                  material.wastage > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {formatNumber(material.wastage || 0)} {material.material?.unit || ""}
              </span>
              {material.wastage && material.wastage > 0 && material.plannedQuantity > 0 && (
                <span className="text-xs text-red-600 dark:text-red-400">
                  ({((material.wastage / material.plannedQuantity) * 100).toFixed(1)}%)
                </span>
              )}
            </div>
          </td>
        )}
        <td className="px-4 py-3 text-right">
          <span className="text-gray-900 dark:text-white">
            {formatCurrency(material.unitPrice)}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <span className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(material.plannedQuantity * material.unitPrice)}
          </span>
        </td>
        <td className="px-4 py-3">
          {isShortage ? (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Thiếu {formatNumber(shortage.shortage)} {shortage.unit}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Đủ</span>
            </div>
          )}
        </td>
      </tr>
    );
  };

  const renderMaterialGroup = (
    title: string,
    groupMaterials: ProductionOrderMaterial[]
  ) => {
    if (groupMaterials.length === 0) return null;

    const totalCost = groupMaterials.reduce(
      (sum, m) => sum + m.plannedQuantity * m.unitPrice,
      0
    );

    return (
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Tổng: {formatCurrency(totalCost)}
          </span>
        </div>
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Nguyên liệu
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  SL Kế hoạch
                </th>
                {effectiveShowAvailability && (
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    {status === "pending" ? "Khả dụng kho" : "Tồn kho"}
                  </th>
                )}
                {effectiveShowActual && (
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    Thực xuất
                  </th>
                )}
                {effectiveShowWastage && (
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    Hao hụt
                  </th>
                )}
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Đơn giá
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Thành tiền
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {groupMaterials.map(renderMaterialRow)}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const totalCost = materials.reduce(
    (sum, m) => sum + m.plannedQuantity * m.unitPrice,
    0
  );

  return (
    <div className="space-y-6">
      {/* Alert if there are shortages */}
      {hasShortages && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h4 className="font-semibold text-red-900 dark:text-red-200">
                Cảnh báo thiếu nguyên liệu
              </h4>
              <p className="mt-1 text-sm text-red-800 dark:text-red-300">
                Có {shortages.length} nguyên liệu/bao bì không đủ số lượng để sản xuất.
                Vui lòng nhập kho trước khi bắt đầu sản xuất.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Material Groups */}
      {renderMaterialGroup("Nguyên liệu", rawMaterials)}
      {renderMaterialGroup("Bao bì", packaging)}

      {/* Total Cost */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Tổng chi phí nguyên liệu
          </span>
          <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
            {formatCurrency(totalCost)}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {materials.length} nguyên liệu/bao bì
        </p>
      </div>
    </div>
  );
}
