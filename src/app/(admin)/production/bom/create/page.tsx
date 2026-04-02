"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateBOM, useProducts } from "@/hooks/api";
import { Can } from "@/components/auth";
import MaterialsTable from "@/components/production/MaterialsTable";
import Button from "@/components/ui/button/Button";
import { BomFormData, ApiResponse, Product } from "@/types";
import { createBomSchema } from "@/lib/validations";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import SearchableSelect from "@/components/ui/SearchableSelect";

export default function CreateBOMPage() {
  const router = useRouter();
  const createBOM = useCreateBOM();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch finished products
  const { data: productsData } = useProducts({
    productType: 'finished_product',
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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createBomSchema),
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
        productionTime: data.productionTime,
        notes: data.notes,
        materials: data.materials.map((m) => ({
          materialId: m.materialId,
          quantity: m.quantity,
          unit: m.unit,
          materialType: m.materialType,
          notes: m.notes,
        })),
      };

      await createBOM.mutateAsync(payload);
      router.push("/production/bom");
    } catch (error) {
      console.error("Create BOM error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tạo BOM Mới
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Tạo công thức sản xuất cho sản phẩm thành phẩm
            </p>
          </div>
          <Link
            href={"/production/bom"}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
            Quay lại
          </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="rounded-lg border bg-white p-6 shadow dark:bg-gray-800">
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
                Phiên bản <span className="text-red-500">*</span>
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
              <SearchableSelect
                options={finishedProducts.map((s) => ({
                value: s.id,
                label: s.sku + " - " + s.productName,
                }))}
                value={watch("finishedProductId") || ""}
                onChange={(value) => setValue("finishedProductId", Number(value))}
                placeholder="Tìm kiếm sản phẩm thành phẩm..."
            />
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
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
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
          <Link href="/production/bom">
            <Button variant="outline" size="md" disabled={isSubmitting}>
              Hủy
            </Button>
          </Link>

          <Can permission="create_bom">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Đang tạo...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Tạo BOM
                </>
              )}
            </Button>
          </Can>
        </div>
      </form>
    </div>
  );
}
