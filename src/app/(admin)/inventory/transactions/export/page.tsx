"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWarehouses, useProducts, useCreateExportTransaction } from "@/hooks/api";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import { ProductSelector } from "@/components/inventory/ProductSelector";
import { TransactionItems } from "@/components/inventory/TransactionItems";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { createExportSchema, ExportFormData } from "@/lib/validations/stock-transaction.schema";
import { Product, Warehouse } from "@/types";
import { Decimal } from "decimal.js";
import { toast } from "react-hot-toast";

export default function ExportTransactionPage() {
  const router = useRouter();
  const { data: warehousesResponse } = useWarehouses();
  const { data: productsResponse } = useProducts();
  const createExport = useCreateExportTransaction();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const warehouses = warehousesResponse?.data as unknown as Warehouse[] || [];
  const allProducts = productsResponse?.data as unknown as Product[] || [];

  const exportWarehouses = warehouses.filter((w) =>
    ["finished_product", "goods"].includes(w.warehouseType)
  );

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createExportSchema),
    defaultValues: {
      details: [],
      reason: "Xuất bán",
      referenceType: "",
      referenceId: undefined,
    },
  });

  const details = watch("details");
  const referenceType = watch("referenceType");

  const handleAddProduct = (productId: number) => {
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return;

    const newDetail = {
      productId,
      quantity: 1,
      unitPrice: product.sellingPriceRetail ? new Decimal(product.sellingPriceRetail).toNumber() : 0,
      batchNumber: "",
      expiryDate: product.expiryDate,
      notes: "",
    };

    setValue("details", [...details, newDetail]);
  };

  const handleRemoveItem = (index: number) => {
    setValue("details", details.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, updates: any) => {
    const updated = [...details];
    updated[index] = { ...updated[index], ...updates };
    setValue("details", updated);
  };

   console.log('detail', details);

  const totals = details.reduce(
    (acc, item) => {
        const quantity = new Decimal(item.quantity || 0);
        const unitPrice = new Decimal(item.unitPrice || 0);

        const itemTotal = quantity.mul(unitPrice);

        return {
            quantity: acc.quantity.add(quantity),
            total: acc.total.add(itemTotal),
        };
    },
    { quantity: new Decimal(0), total: new Decimal(0) }
  );

  const onSubmit = async (data: ExportFormData) => {
    try {
      // Clean up referenceType and referenceId if not selected
      const submitData = {
        ...data,
        referenceType: data.referenceType || undefined,
        referenceId: data.referenceId || undefined,
      };

      await createExport.mutateAsync(submitData);
      router.push("/inventory/transactions");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleConfirmSubmit = () => {
    setShowConfirmDialog(false);
    handleSubmit(onSubmit)();
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tạo phiếu xuất kho
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Lập phiếu xuất hàng cho khách hàng hoặc sản xuất
          </p>
        </div>
        <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit(
        (data) => {
          setShowConfirmDialog(true);
        },
        (errors) => {
            toast.error("Tạo phiếu xuất kho thất bại!");
        }
      )} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Warehouse & Reference */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Thông tin kho
              </h2>

              <div className="space-y-4">
                {/* Warehouse */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kho xuất <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("warehouseId", { valueAsNumber: true })}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">-- Chọn kho --</option>
                    {exportWarehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.warehouseName} ({w.warehouseType})
                      </option>
                    ))}
                  </select>
                  {errors.warehouseId && (
                    <p className="mt-1 text-sm text-red-600">Vui lòng chọn kho xuất</p>
                  )}
                </div>

                {/* Reference Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Loại tham chiếu
                  </label>
                  <select
                    {...register("referenceType")}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">-- Không có (Xuất thường) --</option>
                    <option value="sales_order">Từ đơn hàng bán</option>
                    <option value="production_order">Cho sản xuất</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {!referenceType && "Xuất hàng thông thường"}
                    {referenceType === "sales_order" && "Xuất hàng theo đơn hàng đã được xác nhận"}
                    {referenceType === "production_order" && "Xuất nguyên liệu/bao bì cho sản xuất"}
                  </p>
                </div>

                {/* Reference ID */}
                {referenceType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {referenceType === "sales_order" ? "Mã đơn hàng" : "Mã lệnh sản xuất"}
                    </label>
                    <input
                      type="number"
                      {...register("referenceId", { valueAsNumber: true })}
                      placeholder={`Nhập ID ${referenceType === "sales_order" ? "Sales Order" : "Production Order"}`}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Tạm thời nhập ID thủ công. Dropdown selection sẽ được thêm sau.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Add Products */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Chọn sản phẩm
              </h2>
              <ProductSelector
                onSelect={(product) => handleAddProduct(product.id)}
                excludeProductIds={details.map((d) => d.productId)}
              />
            </div>
          </div>
          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="top-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold">Tóm tắt đơn hàng</h3>

              <div className="space-y-3 border-b border-gray-200 pb-4 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Số sản phẩm:</span>
                  <span className="font-semibold">{details.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tổng số lượng:</span>
                  <span className="font-semibold">{totals.quantity.toNumber()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tổng giá trị:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {formatCurrency(totals.total.toNumber())}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={details.length === 0}
                >
                  Tạo phiếu xuất
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

              {details.length === 0 && (
                <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
                  Vui lòng thêm ít nhất 1 sản phẩm
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        {details.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Danh sách sản phẩm
                </h2>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  {details.length} sản phẩm
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="p-6">
                <TransactionItems
                    type="export"
                    items={details}
                    products={allProducts}
                    onRemoveItem={handleRemoveItem}
                    onUpdateItem={handleUpdateItem}
                    showPrice={true}
                    showBatchNumber={true}
                    showExpiryDate={false}
                    showNotes={true}
                    readonly={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold">Thông tin bổ sung</h2>
            <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lý do xuất
                </label>
                <select
                {...register("reason")}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                <option value="Xuất bán">Xuất bán hàng</option>
                <option value="Xuất sản xuất">Xuất cho sản xuất</option>
                <option value="Xuất trả NCC">Xuất trả nhà cung cấp</option>
                <option value="Xuất mẫu">Xuất mẫu</option>
                <option value="Xuất khác">Xuất khác</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ghi chú
                </label>
                <textarea
                {...register("notes")}
                placeholder="Ghi chú thêm về phiếu xuất..."
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
            </div>
          </div>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmSubmit}
        title="Xác nhận tạo phiếu xuất"
        message={`Bạn có chắc chắn muốn tạo phiếu xuất kho với ${details.length} sản phẩm (tổng ${totals.quantity} đơn vị) không? Tổng giá trị: ${formatCurrency(totals.total.toNumber())}`}
        confirmText="Tạo phiếu"
        variant="warning"
        isLoading={isSubmitting}
      />
    </div>
  );
}
