"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBOM, useUpdateBOM, useProducts } from "@/hooks/api";
import { Can } from "@/components/auth";
import MaterialsTable from "@/components/production/MaterialsTable";
import Button from "@/components/ui/button/Button";
import { BomFormData, ApiResponse, Product, Bom } from "@/types";
import { updateBomSchema } from "@/lib/validations";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function EditBOMPage() {
  const params = useParams();
  const router = useRouter();
  const bomId = parseInt(params.id as string);
  const updateBOM = useUpdateBOM();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch BOM data
  const { data: bomData, isLoading: isLoadingBOM } = useBOM(bomId);
  const bomResponse = bomData as unknown as ApiResponse<Bom>;
  const bom = bomResponse?.data;

  // Fetch finished products
  const { data: productsData } = useProducts({
    productType: 'finished_product',
    status: "active",
    limit: 1000,
  });

  const finishedProducts = ((productsData as unknown as ApiResponse<Product[]>)?.data || []);

  // Form
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateBomSchema),
    defaultValues: {
      bomCode: "",
      finishedProductId: 0,
      version: "1.0",
      outputQuantity: 1,
      efficiencyRate: 100,
      productionTime: undefined,
      notes: "",
      materials: [],
    },
  });

  // Load BOM data into form
  useEffect(() => {
    if (bom) {
      // Check if BOM can be edited
      if (bom.status !== "draft") {
        alert("Chỉ có thể chỉnh sửa BOM ở trạng thái nháp!");
        router.push(`/production/bom/${bomId}`);
        return;
      }

      reset({
        bomCode: bom.bomCode,
        finishedProductId: bom.finishedProductId,
        version: bom.version,
        outputQuantity: Number(bom.outputQuantity),
        efficiencyRate: Number(bom.efficiencyRate),
        productionTime: bom.productionTime || undefined,
        notes: bom.notes || "",
        materials: bom.materials?.map((m) => ({
          id: m.id,
          materialId: m.materialId,
          materialName: m.material?.productName,
          materialSku: m.material?.sku || "",
          quantity: Number(m.quantity),
          unit: m.unit,
          materialType: m.materialType,
          notes: m.notes || "",
        })) || [],
      });
    }
  }, [bom, bomId, router, reset]);

  const selectedProductId = watch("finishedProductId");
  const selectedProduct = finishedProducts.find((p) => p.id === selectedProductId);

  // Handle Form Submit
  const onSubmit = async (data: BomFormData) => {
    setIsSubmitting(true);

    try {
      // Transform data to API format
      const payload = {
        bomCode: data.bomCode,
        finishedProductId: data.finishedProductId,
        version: data.version,
        outputQuantity: data.outputQuantity,
        efficiencyRate: data.efficiencyRate,
        productionTime: data.productionTime || undefined,
        notes: data.notes || undefined,
        materials: data.materials.map((m) => ({
          materialId: m.materialId,
          quantity: m.quantity,
          unit: m.unit,
          materialType: m.materialType,
          notes: m.notes,
        })),
      };

      await updateBOM.mutateAsync({ id: bomId, data: payload });
      router.push(`/production/bom/${bomId}`);
    } catch (error) {
      console.error("Update BOM error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingBOM) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!bom) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-900 dark:bg-red-900/20 dark:text-red-300">
        <h3 className="font-semibold">Lỗi</h3>
        <p className="text-sm">Không tìm thấy BOM</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Chỉnh sửa BOM: {bom.bomCode}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Cập nhật công thức sản xuất
            </p>
        </div>
        <Button
          variant="outline"
          size="ssm"
          onClick={() => router.back()}
        >
            <ArrowLeft className="h-5 w-5" />
            Quay lại
        </Button>
      </div>

      {/* Warning if not draft */}
      {bom.status !== "draft" && (
        <div className="rounded-lg bg-yellow-50 p-4 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-300">
          <h3 className="font-semibold">Cảnh báo</h3>
          <p className="text-sm">
            BOM này không ở trạng thái nháp. Bạn không thể chỉnh sửa. Vui lòng tạo phiên bản mới.
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="rounded-lg border bg-white p-6 shadow dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Thông tin cơ bản
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* BOM Code */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mã BOM <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("bomCode")}
                placeholder="VD: BOM-TP-001"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.bomCode && (
                <p className="mt-1 text-sm text-red-600">{errors.bomCode.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Chỉ cho phép chữ hoa, số và dấu gạch ngang
              </p>
            </div>

            {/* Version */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phiên bản
              </label>
              <input
                type="text"
                {...register("version")}
                placeholder="VD: 1.0"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.version && (
                <p className="mt-1 text-sm text-red-600">{errors.version.message}</p>
              )}
            </div>

            {/* Finished Product */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sản phẩm thành phẩm <span className="text-red-500">*</span>
              </label>
              <select
                {...register("finishedProductId", {
                  setValueAs: (v) => (v === "" ? 0 : parseInt(v)),
                })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">-- Chọn sản phẩm --</option>
                {finishedProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.productName} ({product.sku})
                  </option>
                ))}
              </select>
              {errors.finishedProductId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.finishedProductId.message}
                </p>
              )}
            </div>

            {/* Output Quantity */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sản lượng đầu ra (mỗi mẻ) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  {...register("outputQuantity", {
                    setValueAs: (v) => (v === "" ? 0 : parseFloat(v)),
                  })}
                  min="0"
                  step="0.01"
                  placeholder="VD: 100"
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                {selectedProduct && (
                  <div className="flex items-center rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 dark:border-gray-600 dark:bg-gray-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedProduct.unit}
                    </span>
                  </div>
                )}
              </div>
              {errors.outputQuantity && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.outputQuantity.message}
                </p>
              )}
            </div>

            {/* Efficiency Rate */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tỷ lệ hiệu suất (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                {...register("efficiencyRate", {
                  setValueAs: (v) => (v === "" ? 100 : parseFloat(v)),
                })}
                min="0"
                max="100"
                step="0.1"
                placeholder="VD: 95"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.efficiencyRate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.efficiencyRate.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Tỷ lệ hiệu suất sản xuất (thường từ 90-100%)
              </p>
            </div>

            {/* Production Time */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Thời gian sản xuất (phút)
              </label>
              <input
                type="number"
                {...register("productionTime", {
                  setValueAs: (v) => (v === "" ? undefined : parseInt(v)),
                })}
                min="0"
                placeholder="VD: 120"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.productionTime && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.productionTime.message}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ghi chú
              </label>
              <textarea
                {...register("notes")}
                rows={3}
                placeholder="Ghi chú về công thức sản xuất..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Materials Section */}
        <div className="rounded-lg border bg-white p-6 shadow dark:bg-gray-800">
          <Controller
            name="materials"
            control={control}
            render={({ field }) => (
              <MaterialsTable
                materials={field.value}
                onChange={field.onChange}
                errors={errors.materials}
              />
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href={`/production/bom/${bomId}`}>
            <Button variant="outline" size="md" disabled={isSubmitting}>
              Hủy
            </Button>
          </Link>

          <Can permission="update_bom">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting || bom.status !== "draft"}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Cập nhật BOM
                </>
              )}
            </Button>
          </Can>
        </div>
      </form>
    </div>
  );
}
