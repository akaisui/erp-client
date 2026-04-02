"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWarehouses, useProducts, useCreateImportTransaction, usePurchaseOrder } from "@/hooks/api";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import { ProductSelector } from "@/components/inventory";
import { TransactionItems } from "@/components/inventory";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Package, AlertCircle, Loader } from "lucide-react";
import { Product, Warehouse, PurchaseOrder } from "@/types";
import { createImportSchema, ImportFormData } from "@/lib/validations/stock-transaction.schema";
import { Decimal } from "decimal.js";
import { toast } from "react-hot-toast";

export default function ImportTransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const poId = searchParams?.get("po_id");
  
  const { data: warehousesResponse } = useWarehouses();
  const { data: productsResponse } = useProducts();
  const { data: poResponse, isLoading: poLoading } = usePurchaseOrder(
    poId ? parseInt(poId) : 0,
    !!poId
  );
  const createImport = useCreateImportTransaction();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const warehouses = warehousesResponse?.data as unknown as Warehouse[] || [];
  const allProducts = productsResponse?.data as unknown as Product[] || [];
  const po = poResponse?.data as unknown as PurchaseOrder | undefined;

  const importWarehouses = warehouses.filter((w) =>
    ["raw_material", "packaging", "finished_product", "goods"].includes(w.warehouseType)
  );

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createImportSchema),
    defaultValues: {
      details: [],
      reason: poId ? `Nhập từ PO` : "Nhập từ NCC",
      referenceType: poId ? "purchase_order" : "",
      referenceId: poId ? parseInt(poId) : undefined,
    },
  });

  // Điền trước biểu mẫu khi dữ liệu đơn đặt hàng được tải - chỉ fill một lần
  useEffect(() => {
    console.log("useEffect triggered - po:", !!po, "poId:", poId, "isInitialized:", isInitialized);
    if (po && poId && !isInitialized) {
      console.log("Filling form with PO data");
      setValue("warehouseId", po.warehouseId);

      const poDetails = po.details?.map((d: any) => ({
        productId: d.productId,
        quantity: Number(d.quantity),
        unitPrice: Number(d.unitPrice),
        batchNumber: "",
        expiryDate: "",
        notes: d.notes || "",
      })) || [];

      console.log("poDetails from PO:", poDetails);
      setValue("details", poDetails);

      setValue("referenceType", "purchase_order");
      setValue("referenceId", po.id);

      setValue("reason", `Nhập từ PO ${po.poCode}`);

      setValue("notes", po.notes);
      
      setIsInitialized(true);
      console.log("Form filled and isInitialized set to true");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poId, isInitialized]);

  const details = watch("details");
  const referenceType = watch("referenceType");
  const warehouseId = watch("warehouseId");

  useEffect(() => {
    console.log("WATCH - details updated:", details.length, details);
  }, [details]);

  const handleAddProduct = (productId: number) => {
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return;

    // Nếu đến từ PO, không cho thêm sản phẩm khác
    if (poId) {
      toast.error("Khi nhận hàng từ PO, chỉ có thể nhập các sản phẩm trong đơn");
      return;
    }

    const newDetail = {
      productId,
      quantity: 1,
      unitPrice: product.purchasePrice ? new Decimal(product.purchasePrice).toNumber() : 0,
      batchNumber: "",
      expiryDate: product.expiryDate,
      notes: "",
    };

    setValue("details", [...details, newDetail]);
  };

  const handleRemoveItem = (index: number) => {
    setValue(
      "details",
      details.filter((_, i) => i !== index)
    );
  };

  const handleUpdateItem = (index: number, updates: any) => {
    console.log("handleUpdateItem called - index:", index, "updates:", updates, "current details length:", details.length);
    const updated = [...details];
    console.log("updated array before merge:", updated.length);
    updated[index] = { ...updated[index], ...updates };
    console.log("updated array after merge:", updated.length);
    console.log("full updated array:", updated);
    setValue("details", updated);
    console.log("after setValue");
  };


  const totals = details.reduce(
    (acc, item) => {
        const qty = new Decimal(item.quantity || 0);
        const price = new Decimal(item.unitPrice || 0);

        const itemTotal = qty.mul(price);

        return {
        quantity: acc.quantity.add(qty),
        total: acc.total.add(itemTotal),
        };
    },
    {
        quantity: new Decimal(0),
        total: new Decimal(0),
    }
  );

  const onSubmit = async (data: ImportFormData) => {
    try {
      const submitData = {
        ...data,
        referenceType: data.referenceType || undefined,
        referenceId: data.referenceId || undefined,
      };

      await createImport.mutateAsync(submitData);
      
      // Nếu từ PO, redirect về trang chi tiết PO
      if (poId) {
        router.push(`/purchase-orders/${poId}`);
      } else {
        router.push("/inventory/transactions");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const convertWarehouseType = (type: string) => {
    switch (type) {
        case "raw_material":
            return "Nguyên liệu";
        case "packaging":
            return "Bao bì";
        case "finished_product":
            return "Thành phẩm";
        case "goods":
            return "Hàng hóa";
        default:
            return "";
    }
  }

  const handleConfirmSubmit = () => {
    setShowConfirmDialog(false);
    handleSubmit(onSubmit)();
  };

  return (
    <div className="space-y-6">

      {/* Header - Dynamic based on PO context */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {poId ? `Nhận hàng - ${po?.poCode || "Đang tải..."}` : "Tạo phiếu nhập kho"}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {poId 
              ? `Nhà cung cấp: ${po?.supplier?.supplierName || "Đang tải..."}`
              : "Lập phiếu nhập hàng từ nhà cung cấp hoặc từ sản xuất"
            }
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

      {/* Loading state while fetching PO */}
      {poId && poLoading && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-center gap-3 dark:border-blue-900 dark:bg-blue-900/30">
          <Loader className="h-5 w-5 animate-spin text-blue-600" />
          <p className="text-sm text-blue-700 dark:text-blue-300">Đang tải thông tin đơn đặt hàng...</p>
        </div>
      )}

      {/* PO Info Alert */}
      {poId && po && !poLoading && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/30">
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-800 dark:text-green-300">
                Đơn đặt hàng: {po.poCode}
              </p>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                Nhà cung cấp: {po.supplier?.supplierName} | Kho: {po.warehouse?.warehouseName}
              </p>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                Tổng tiền: {formatCurrency(po.subTotal)} | Số sản phẩm: {po.details?.length}
              </p>
              <p className="text-sm text-orange-400 dark:text-yellow-400 mt-1">
                Lưu ý: Đây chỉ là tổng tiền hàng chưa bao gồm thuế và các chi phí khác. Nếu cần xem đầy đủ cả tiền thuế vui lòng xem ở đơn mua.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(
        (data) => {
          setShowConfirmDialog(true);
        },
        (errors) => {
            toast.error("Tạo phiếu nhập kho thất bại!");
        }
      )} className="space-y-6">
        {/* Top Section - 2 Columns Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Warehouse & Products */}
          <div className="space-y-6 lg:col-span-2">
            {/* Warehouse & Reference */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Thông tin kho
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Warehouse */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kho đích <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("warehouseId", { valueAsNumber: true })}
                    disabled={!!poId}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Chọn kho --</option>
                    {importWarehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.warehouseName} ({convertWarehouseType(w.warehouseType)})
                      </option>
                    ))}
                  </select>
                  {errors.warehouseId && (
                    <p className="mt-1 text-sm text-red-600">{errors.warehouseId.message}</p>
                  )}
                  {poId && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      🔒 Tự động từ đơn đặt hàng
                    </p>
                  )}
                </div>

                {/* Reference Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Loại tham chiếu
                  </label>
                  <select
                    {...register("referenceType")}
                    disabled={!!poId}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Không có --</option>
                    <option value="purchase_order">Từ đơn đặt hàng</option>
                    <option value="production_order">Từ sản xuất</option>
                  </select>
                  {poId && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      🔒 Tự động từ đơn đặt hàng
                    </p>
                  )}
                </div>

                {/* Reference ID */}
                {referenceType && !poId && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {referenceType === "purchase_order" ? "Mã đơn đặt hàng" : "Mã lệnh sản xuất"}
                    </label>
                    <input
                      type="number"
                      {...register("referenceId", { valueAsNumber: true })}
                      placeholder="Nhập ID"
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Add Products - Hidden if from PO */}
            {!poId && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Chọn sản phẩm
                </h2>
                <ProductSelector
                  onSelect={(product) => handleAddProduct(product.id)}
                  excludeProductIds={details.map((d) => d.productId)}
                />
              </div>
            )}

            {/* PO Products Info - Show if from PO */}
            {poId && po && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-900/30">
                <h2 className="mb-4 text-lg font-semibold text-blue-900 dark:text-blue-300">
                  Danh sách sản phẩm (từ đơn đặt hàng)
                </h2>
                <div className="space-y-2">
                  {po.details?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded dark:bg-gray-800">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.product?.productName}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.quantity} {item.product?.unit}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/50 rounded text-sm text-blue-700 dark:text-blue-300">
                  <AlertCircle className="inline h-4 w-4 mr-2" />
                  Bạn có thể chỉnh sửa số lượng, thêm lô hàng và hạn SD bên dưới
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Tóm tắt đơn hàng
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Số sản phẩm:</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{details.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Tổng số lượng:</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{totals.quantity.toNumber()}</span>
                </div>
                <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tổng giá trị:</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(totals.total.toNumber())}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={details.length === 0 || !!poLoading}
                  isLoading={isSubmitting}
                >
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {poId ? "Nhận hàng" : "Tạo phiếu nhập"}
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

              {details.length === 0 && !poId && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    Vui lòng thêm sản phẩm
                  </p>
                </div>
              )}

              {details.length === 0 && poId && (
                <div className="mt-4 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/30">
                  <p className="text-xs text-center text-yellow-700 dark:text-yellow-300">
                    ⏳ Đang tải danh sách sản phẩm từ đơn đặt hàng...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table - Full Width */}
        {poLoading ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-900/30">
            <p className="text-sm text-blue-700 dark:text-blue-300">⏳ Đang tải dữ liệu sản phẩm từ đơn đặt hàng...</p>
          </div>
        ) : details.length > 0 && (
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
                  items={details}
                  products={allProducts}
                  onRemoveItem={handleRemoveItem}
                  onUpdateItem={handleUpdateItem}
                  showPrice={true}
                  showBatchNumber={true}
                  showExpiryDate={true}
                  showNotes={true}
                  readonly={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* Notes - Full Width */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Lý do nhập
            </h2>
            <input
              type="text"
              {...register("reason")}
              placeholder="VD: Nhập từ NCC ABC, Nhập theo PO-001..."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Ghi chú
            </h2>
            <textarea
              {...register("notes")}
              placeholder="Ghi chú thêm về phiếu nhập..."
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmSubmit}
        title="Xác nhận tạo phiếu nhập"
        message={`Bạn có chắc chắn muốn tạo phiếu nhập kho với ${details.length} sản phẩm (tổng ${totals.quantity} đơn vị) không? Tổng giá trị: ${formatCurrency(totals.total.toNumber())}`}
        confirmText="Tạo phiếu"
        variant="info"
        isLoading={isSubmitting}
      />
    </div>
  );
}
