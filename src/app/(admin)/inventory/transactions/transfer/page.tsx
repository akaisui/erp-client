"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWarehouses, useProducts, useCreateTransferTransaction } from "@/hooks/api";
import { createTransferSchema, type TransferFormData } from "@/lib/validations/stock-transaction.schema";
import Button from "@/components/ui/button/Button";
import { ProductSelector } from "@/components/inventory/ProductSelector";
import { TransactionItems } from "@/components/inventory/TransactionItems";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Package } from "lucide-react";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";

export default function TransferTransactionPage() {
  const router = useRouter();
  const { data: warehousesResponse } = useWarehouses();
  const { data: productsResponse } = useProducts();
  const createTransfer = useCreateTransferTransaction();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const warehouses = warehousesResponse?.data || [];
  const allProducts = productsResponse?.data || [];

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createTransferSchema),
    defaultValues: {
      details: [],
      reason: "Chuyển kho",
      referenceType: "",
      referenceId: undefined,
    },
  });

  const details = watch("details");
  const sourceWarehouse = watch("sourceWarehouseId");
  const destinationWarehouse = watch("destinationWarehouseId");
  const referenceType = watch("referenceType");

  const handleAddProduct = (productId: number) => {
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return;

    setValue("details", [
      ...details,
      {
        productId,
        quantity: 1,
        unitPrice: product.purchasePrice || 0,
        batchNumber: "",
        notes: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setValue("details", details.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, updates: Partial<TransferFormData["details"][0]>) => {
    const updated = [...details];
    updated[index] = { ...updated[index], ...updates };
    setValue("details", updated);
  };

  const totals = details.reduce(
    (acc, item) => {
      const itemTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);
      return {
        quantity: acc.quantity + Number(item.quantity || 0),
        total: acc.total + itemTotal,
      };
    },
    { quantity: 0, total: 0 }
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmDialog(true);
  };

  const onConfirm = async () => {
    const data = getValues();

    // Clean up empty strings to undefined
    const cleanData = {
      ...data,
      referenceType: data.referenceType?.trim() || undefined,
      referenceId: data.referenceId || undefined,
    };

    try {
      await createTransfer.mutateAsync(cleanData);
      router.push("/inventory/transactions");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const sourceWarehouseName = warehouses.find((w) => w.id === sourceWarehouse)?.warehouseName || "";
  const destinationWarehouseName = warehouses.find((w) => w.id === destinationWarehouse)?.warehouseName || "";

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
            Tạo phiếu chuyển kho
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Chuyển hàng giữa các kho trong hệ thống
          </p>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Warehouse Selection */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold">Thông tin kho</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Kho nguồn *
                  </label>
                  <select
                    {...register("sourceWarehouseId", { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="">-- Chọn kho nguồn --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id} disabled={w.id === destinationWarehouse}>
                        {w.warehouseName} ({w.warehouseType === "raw_material" ? "Nguyên liệu" : w.warehouseType === "packaging" ? "Bao bì" : w.warehouseType === "finished_product" ? "Thành phẩm" : "Hàng hóa"})
                      </option>
                    ))}
                  </select>
                  {errors.sourceWarehouseId && (
                    <p className="mt-1 text-sm text-red-600">{errors.sourceWarehouseId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Kho đích *
                  </label>
                  <select
                    {...register("destinationWarehouseId", { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="">-- Chọn kho đích --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id} disabled={w.id === sourceWarehouse}>
                        {w.warehouseName} ({w.warehouseType === "raw_material" ? "Nguyên liệu" : w.warehouseType === "packaging" ? "Bao bì" : w.warehouseType === "finished_product" ? "Thành phẩm" : "Hàng hóa"})
                      </option>
                    ))}
                  </select>
                  {errors.destinationWarehouseId && (
                    <p className="mt-1 text-sm text-red-600">{errors.destinationWarehouseId.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Reference Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold">Liên kết đơn hàng</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Loại đơn hàng
                  </label>
                  <select
                    {...register("referenceType")}
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="">Không liên kết</option>
                    <option value="production_order">Lệnh sản xuất</option>
                    <option value="sales_order">Đơn hàng bán</option>
                  </select>
                  {referenceType && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {referenceType === "production_order" && "Chuyển kho phục vụ sản xuất"}
                      {referenceType === "sales_order" && "Chuyển kho phục vụ bán hàng"}
                    </p>
                  )}
                </div>

                {referenceType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mã đơn hàng
                    </label>
                    <input
                      type="number"
                      {...register("referenceId", { valueAsNumber: true })}
                      placeholder="VD: 123"
                      className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Tạm thời nhập ID thủ công. Dropdown sẽ được bổ sung sau.
                    </p>
                    {errors.referenceId && (
                      <p className="mt-1 text-sm text-red-600">{errors.referenceId.message}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Product Selection */}
            {sourceWarehouse && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-semibold">Chọn sản phẩm</h2>
                <ProductSelector
                  onSelect={(product) => handleAddProduct(product.id)}
                  excludeProductIds={details.map((d) => d.productId)}
                />
              </div>
            )}

            {/* Transaction Items */}
            {details.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-semibold">
                  Danh sách sản phẩm ({details.length})
                </h2>
                <TransactionItems
                  items={details}
                  products={allProducts}
                  onRemoveItem={handleRemoveItem}
                  onUpdateItem={handleUpdateItem}
                  showPrice={true}
                  showBatchNumber={true}
                  showExpiryDate={false}
                  showNotes={true}
                />
              </div>
            )}

            {/* Additional Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold">Thông tin bổ sung</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Lý do chuyển kho
                  </label>
                  <input
                    type="text"
                    {...register("reason")}
                    placeholder="VD: Cân bằng tồn kho"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ghi chú
                  </label>
                  <textarea
                    {...register("notes")}
                    placeholder="Ghi chú thêm về phiếu chuyển kho..."
                    rows={3}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div>
            <div className="sticky top-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold">Tóm tắt</h3>
              <div className="space-y-3 border-b border-gray-200 pb-4 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Số sản phẩm:</span>
                  <span className="font-semibold">{details.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tổng số lượng:</span>
                  <span className="font-semibold">{totals.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tổng giá trị:</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isSubmitting || details.length === 0}
                  isLoading={isSubmitting}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Tạo phiếu chuyển kho
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={onConfirm}
        title="Xác nhận tạo phiếu chuyển kho"
        message={
          <div className="space-y-2 text-sm">
            <p>
              <strong>Kho nguồn:</strong> {sourceWarehouseName}
            </p>
            <p>
              <strong>Kho đích:</strong> {destinationWarehouseName}
            </p>
            <p>
              <strong>Số sản phẩm:</strong> {details.length}
            </p>
            <p>
              <strong>Tổng số lượng:</strong> {totals.quantity}
            </p>
            <p>
              <strong>Tổng giá trị:</strong> {formatCurrency(totals.total)}
            </p>
          </div>
        }
        confirmText="Xác nhận"
        cancelText="Kiểm tra lại"
        variant="info"
        isLoading={createTransfer.isPending}
      />
    </div>
  );
}
