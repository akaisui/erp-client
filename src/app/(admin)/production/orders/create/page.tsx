"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreateProductionOrder,
  useBOMs,
  useWarehouses,
  useBOM,
  useCalculateMaterials,
} from "@/hooks/api";
import Button from "@/components/ui/button/Button";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { FormDatePicker } from "@/components/form/FormDatePicker";
import { MaterialRequirements } from "@/components/production";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import {
  createProductionOrderSchema,
  type CreateProductionOrderInput,
} from "@/lib/validations";
import { ApiResponse, Warehouse, ProductionOrderMaterial, MaterialShortage, Bom } from "@/types";
import { ArrowLeft, Save, Calculator, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default function CreateProductionOrderPage() {
  const router = useRouter();
  const [selectedBOMId, setSelectedBOMId] = useState<number | null>(null);
  const [calculatedMaterials, setCalculatedMaterials] = useState<ProductionOrderMaterial[]>([]);
  const [materialShortages, setMaterialShortages] = useState<MaterialShortage[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<CreateProductionOrderInput | null>(null);
  const [isConfirmDialogLoading, setIsConfirmDialogLoading] = useState(false);

  // Fetch data
  const { data: bomsData } = useBOMs({ 
    status: "active" 
  });
  const boms = bomsData?.data as unknown as Bom[] || [];

  const { data: warehousesData } = useWarehouses({ 
    status: "active",
    warehouseType: "finished_product",
  });
  const warehouses = warehousesData?.data as unknown as Warehouse[] || [];

  // Fetch chi tiết BOM đã chọn
  const { data: bomData } = useBOM(selectedBOMId || 0, !!selectedBOMId);
  const selectedBOM = bomData?.data as unknown as Bom;

  const createOrder = useCreateProductionOrder();
  const calculateMaterialsAPI = useCalculateMaterials();

  // Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateProductionOrderInput>({
    resolver: zodResolver(createProductionOrderSchema),
    defaultValues: {
      plannedQuantity: 1,
      startDate: new Date().toISOString().split("T")[0],
    },
  });

  const watchBOMId = watch("bomId");
  const watchPlannedQuantity = watch("plannedQuantity");

  // Tính toán vật liệu khi định mức nguyên vật liệu (BOM) hoặc số lượng thay đổi.
  useEffect(() => {
    if (selectedBOMId && watchPlannedQuantity > 0) {
      calculateMaterialsFromAPI();
    } else {
      setCalculatedMaterials([]);
      setMaterialShortages([]);
    }
  }, [selectedBOMId, watchPlannedQuantity]);

  // Xử lý chọn BOM
  useEffect(() => {
    if (watchBOMId) {
      setSelectedBOMId(Number(watchBOMId));
    }
  }, [watchBOMId]);

  // Gọi API để tính toán nhu cầu vật tư (bao gồm tỷ lệ hiệu quả và lượng thiếu hụt).
  const calculateMaterialsFromAPI = async () => {
    if (!selectedBOMId || !watchPlannedQuantity) return;

    try {
      const response = await calculateMaterialsAPI.mutateAsync({
        bomId: selectedBOMId,
        productionQuantity: watchPlannedQuantity,
      });

      const result = response as unknown as ApiResponse<any>;
      
      if (result.data?.materials) {
        const materials = result.data.materials.map((mat: any) => ({
          id: 0,
          productionOrderId: 0,
          materialId: mat.materialId,
          material: {
            id: mat.materialId,
            productName: mat.materialName,
            sku: mat.materialSku,
            purchasePrice: mat.unitPrice,
            unit: mat.unit,
            notes: mat.notes || "",
            currentQuantity: mat.currentQuantity || 0, // Added: from API response
          },
          plannedQuantity: mat.totalQuantityNeeded,
          actualQuantity: 0,
          wastage: 0,
          unitPrice: mat.unitPrice,
          materialType: mat.materialType,
          notes: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        setCalculatedMaterials(materials);
      }

      if (result.data?.shortages && result.data.shortages.length > 0) {
        setMaterialShortages(result.data.shortages);
      } else {
        setMaterialShortages([]);
      }
    } catch (error) {
      console.error("Không tính toán được vật liệu:", error);
      setCalculatedMaterials([]);
      setMaterialShortages([]);
    }
  };

  // Xử lý việc gửi form
  const onSubmit = async (data: CreateProductionOrderInput) => {
    // Nếu có thiếu hụt, hiện dialog xác nhận trước
    if (materialShortages.length > 0) {
      setPendingFormData(data);
      setShowConfirmDialog(true);
      return;
    }

    // Nếu không có thiếu hụt, tạo đơn hàng trực tiếp
    await createProductionOrder(data);
  };

  const createProductionOrder = async (data: CreateProductionOrderInput) => {
    setIsConfirmDialogLoading(true);
    try {
      const response = await createOrder.mutateAsync(data);
      router.push(`/production/orders/${response.data.id}`);
    } catch (error) {
      console.error("Lỗi khi tạo lệnh sản xuất:", error);
    } finally {
      setIsConfirmDialogLoading(false);
      setShowConfirmDialog(false);
      setPendingFormData(null);
    }
  };

  const handleConfirmDialog = async () => {
    if (pendingFormData) {
      await createProductionOrder(pendingFormData);
    }
  };

  const totalCost = calculatedMaterials.reduce(
    (sum, m) => sum + m.plannedQuantity * m.unitPrice,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Tạo Lệnh Sản Xuất
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Tạo lệnh sản xuất mới từ công thức BOM
            </p>
        </div>
        <Button onClick={() => router.push('/production/orders')} variant="outline" size="ssm">
            <ArrowLeft className="h-5 w-5" />
            Quay lại
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Thông tin cơ bản
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* BOM Selection - SearchableSelect */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Công thức sản xuất (BOM) <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={[
                      { value: "", label: "Chọn công thức..." },
                      ...boms.map((bom) => ({
                        value: bom.id,
                        label: `${bom.bomCode} - ${bom.finishedProduct?.productName} (v${bom.version})`,
                      })),
                    ]}
                    value={watchBOMId || ""}
                    onChange={(value) => {
                      const numValue = value ? Number(value) : null;
                      if (numValue) {
                        setValue("bomId", numValue);
                        setSelectedBOMId(numValue);
                      }
                    }}
                    placeholder="Tìm kiếm công thức..."
                    isClearable
                  />
                  {errors.bomId && (
                    <p className="mt-1 text-sm text-red-600">{errors.bomId.message}</p>
                  )}
                </div>

                {/* Selected Product Info */}
                {selectedBOM && (
                  <>
                    <div className="sm:col-span-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                            Sản phẩm: {selectedBOM.finishedProduct?.productName}
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            SKU: {selectedBOM.finishedProduct?.sku} | Đơn vị:{" "}
                            {selectedBOM.finishedProduct?.unit} | Phiên bản: {selectedBOM.version}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* BOM Status Warning */}
                    {selectedBOM.status !== "active" && (
                      <div className="sm:col-span-2 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200">
                              ⚠️ BOM không ở trạng thái "Đang sử dụng"
                            </p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                              Trạng thái hiện tại: <span className="font-semibold uppercase">{selectedBOM.status}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Planned Quantity */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Số lượng kế hoạch <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("plannedQuantity", { valueAsNumber: true })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  {errors.plannedQuantity && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.plannedQuantity.message}
                    </p>
                  )}
                </div>

                {/* Warehouse - SearchableSelect */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Kho nhập thành phẩm
                  </label>
                  <SearchableSelect
                    options={[
                      { value: "", label: "Chọn kho..." },
                      ...warehouses
                        .map((warehouse) => ({
                          value: warehouse.id,
                          label: `${warehouse.warehouseName} (${warehouse.warehouseCode})`,
                        })),
                    ]}
                    value={watch("warehouseId") || ""}
                    onChange={(value) => {
                      if (value) {
                        setValue("warehouseId", Number(value));
                      } else {
                        setValue("warehouseId", undefined);
                      }
                    }}
                    placeholder="Tìm kiếm kho..."
                    isClearable
                  />
                  {errors.warehouseId && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.warehouseId.message}
                    </p>
                  )}
                </div>

                {/* Start Date - FormDatePicker */}
                <div>
                  <FormDatePicker
                    name="startDate"
                    control={control}
                    label="Ngày bắt đầu"
                    placeholder="Chọn ngày bắt đầu"
                    minDate={new Date()}
                    dateFormat="Y-m-d"
                    error={errors.startDate?.message}
                  />
                </div>

                {/* End Date - FormDatePicker */}
                <div>
                  <FormDatePicker
                    name="endDate"
                    control={control}
                    label="Ngày kết thúc (dự kiến)"
                    placeholder="Chọn ngày kết thúc"
                    minDate={new Date()}
                    dateFormat="Y-m-d"
                    error={errors.endDate?.message}
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ghi chú
                  </label>
                  <textarea
                    {...register("notes")}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="Ghi chú thêm về lệnh sản xuất..."
                  />
                  {errors.notes && (
                    <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Material Requirements */}
            {calculatedMaterials.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Định mức nguyên liệu
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calculator className="h-4 w-4" />
                    <span>Tự động tính toán từ BOM</span>
                  </div>
                </div>

                {materialShortages.length > 0 && (
                  <div className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                          ⚠️ Cảnh báo: Thiếu {materialShortages.length} nguyên liệu
                        </h3>
                        <ul className="text-sm text-red-800 dark:text-red-300 space-y-1">
                          {materialShortages.map((shortage, idx) => (
                            <li key={idx} className="flex justify-between gap-4">
                              <span>{shortage.materialName}:</span>
                              <span className="font-semibold">
                                Cần {shortage.required} nhưng chỉ có {shortage.available} (thiếu {shortage.shortage})
                              </span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                          💡 Bạn có thể tiếp tục tạo lệnh, nhưng cần nhập kho nguyên liệu trước khi bắt đầu sản xuất
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <MaterialRequirements
                  materials={calculatedMaterials}
                  shortages={materialShortages}
                />
              </div>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Cost Summary */}
            {calculatedMaterials.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Tổng quan chi phí
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Chi phí nguyên liệu:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(totalCost)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Tổng dự toán:
                      </span>
                      <span className="text-xl font-bold text-brand-600 dark:text-brand-400">
                        {formatCurrency(totalCost)}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                    <p className="text-xs text-blue-900 dark:text-blue-200">
                      Chi phí thực tế sẽ được tính khi hoàn thành sản xuất
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <div className="space-y-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={createOrder.isPending || !selectedBOMId || selectedBOM?.status !== "active"}
                  isLoading={createOrder.isPending}
                  title={selectedBOM?.status !== "active" ? "BOM phải ở trạng thái 'Đang sử dụng'" : ""}
                >
                  <Save className="mr-2 h-5 w-5" />
                  Tạo lệnh sản xuất
                </Button>
                <Link href="/production/orders" className="block">
                  <Button variant="outline" className="w-full">
                    Hủy
                  </Button>
                </Link>
              </div>

              {selectedBOM?.status !== "active" && (
                <div className="mt-3 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                  <p className="text-xs text-red-700 dark:text-red-300">
                    ❌ Không thể tạo lệnh sản xuất. BOM phải có trạng thái "Đang sử dụng"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Confirm Dialog for Material Shortages */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setPendingFormData(null);
        }}
        onConfirm={handleConfirmDialog}
        title="Xác nhận tạo lệnh sản xuất"
        message={`Cảnh báo: Thiếu ${materialShortages.length} nguyên liệu. Bạn có muốn tiếp tục tạo lệnh sản xuất không? Lưu ý: Bạn cần nhập kho nguyên liệu trước khi bắt đầu sản xuất.`}
        confirmText="Tiếp tục"
        cancelText="Hủy"
        variant="warning"
        isLoading={isConfirmDialogLoading}
      />
    </div>
  );
}
