"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useWarehouses, useProducts, useCreateDisposalTransaction } from "@/hooks/api";
import Button from "@/components/ui/button/Button";
import { ProductSelector } from "@/components/inventory/ProductSelector";
import { TransactionItems } from "@/components/inventory/TransactionItems";
import { ArrowLeft } from "lucide-react";

const disposalSchema = z.object({
  warehouseId: z.number().int().positive("Vui lòng chọn kho"),
  reason: z.string().min(1, "Vui lòng nhập lý do xuất hủy").max(255, "Lý do không được quá 255 ký tự"),
  notes: z.string().optional(),
  details: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().positive("Số lượng phải > 0"),
        batchNumber: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .min(1, "Phải thêm ít nhất 1 sản phẩm"),
});

type DisposalFormData = z.infer<typeof disposalSchema>;

export default function DisposalTransactionPage() {
  const router = useRouter();
  const { data: warehousesResponse } = useWarehouses();
  const { data: productsResponse } = useProducts();
  const createDisposal = useCreateDisposalTransaction();

  const warehouses = warehousesResponse?.data || [];
  const allProducts = productsResponse?.data || [];

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DisposalFormData>({
    resolver: zodResolver(disposalSchema),
    defaultValues: {
      details: [],
      reason: "",
    },
  });

  const details = watch("details");

  const handleAddProduct = (productId: number) => {
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return;

    setValue("details", [...details, {
      productId,
      quantity: 1,
      batchNumber: "",
      notes: "",
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setValue("details", details.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updated = [...details];
    updated[index] = { ...updated[index], [field]: value };
    setValue("details", updated);
  };

  const totalQuantity = details.reduce((acc, item) => acc + (item.quantity || 0), 0);

  const onSubmit = async (data: DisposalFormData) => {
    try {
      await createDisposal.mutateAsync(data);
      router.push("/inventory/transactions");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tạo phiếu xuất hủy
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Lập phiếu xuất hủy hàng hỏng, hết hạn hoặc không đạt chất lượng
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Warehouse Selection */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Thông tin kho
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kho xuất hủy *
                </label>
                <select
                  {...register("warehouseId", { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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

            {/* Product Selection */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Chọn sản phẩm
              </h2>
              <ProductSelector
                onSelect={(product) => handleAddProduct(product.id)}
                excludeProductIds={details.map((d) => d.productId)}
              />
            </div>

            {/* Items List */}
            {details.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Danh sách sản phẩm ({details.length})
                </h2>
                <TransactionItems
                  items={details}
                  products={allProducts}
                  onRemoveItem={handleRemoveItem}
                  onUpdateItem={handleUpdateItem}
                  showPrice={false}
                  showBatchNumber={true}
                  showExpiryDate={false}
                />
              </div>
            )}

            {/* Additional Information */}
            <div className="rounded-lg border border-red-100 bg-red-50 p-6 dark:border-red-900 dark:bg-red-900/10">
              <h2 className="mb-4 text-lg font-semibold text-red-900 dark:text-red-300">
                Thông tin xuất hủy
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-red-900 dark:text-red-300">
                    Lý do xuất hủy *
                  </label>
                  <input
                    type="text"
                    {...register("reason")}
                    placeholder="VD: Hàng hết hạn, hàng hỏng, hàng bị lỗi chất lượng..."
                    className="mt-1 block w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm placeholder-red-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-red-700 dark:bg-gray-800 dark:text-white dark:placeholder-red-500"
                  />
                  {errors.reason && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.reason.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    ⚠️ Lý do xuất hủy là bắt buộc để ghi nhận và kiểm soát hàng tồn kho
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ghi chú thêm
                  </label>
                  <textarea
                    {...register("notes")}
                    placeholder="Thông tin chi tiết về tình trạng hàng, người xác nhận, v.v..."
                    rows={4}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div>
            <div className="sticky top-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Tóm tắt
              </h3>

              <div className="space-y-3 border-b border-gray-200 pb-4 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Tổng số lượng:
                  </span>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    {totalQuantity.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Số sản phẩm:
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {details.length}
                  </span>
                </div>
              </div>

              {/* Warning Message */}
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-900/20">
                <div className="flex gap-2">
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="text-xs text-red-800 dark:text-red-300">
                    <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Hàng xuất hủy sẽ không thể hoàn lại</li>
                      <li>Tồn kho sẽ giảm ngay khi phê duyệt</li>
                      <li>Cần ghi rõ lý do để kiểm toán</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-2">
                <Button
                  type="submit"
                  variant="danger"
                  className="w-full"
                  disabled={isSubmitting || details.length === 0}
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Tạo phiếu xuất hủy
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
