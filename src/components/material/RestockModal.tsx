"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSuppliers } from "@/hooks/api";
import { Product, Supplier } from "@/types";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { ShoppingCart, X } from "lucide-react";
import { toast } from "react-hot-toast";

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export function RestockModal({ isOpen, onClose, product }: RestockModalProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState<string>("");
  const [supplierId, setSupplierId] = useState<number | undefined>(
    product.supplierId || undefined
  );
  const [unitPrice, setUnitPrice] = useState<string>(
    product.purchasePrice?.toString() || ""
  );
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: suppliersResponse } = useSuppliers({ status: "active" });
  const suppliers = (suppliersResponse?.data as unknown as Supplier[]) || [];

  const handleRestock = async () => {
    if (!quantity || !supplierId) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      setIsLoading(true);
      // Navigate to purchase order create page with pre-filled data
      const params = new URLSearchParams({
        productId: product.id.toString(),
        supplierId: supplierId.toString(),
        quantity: quantity,
        unitPrice: unitPrice || product.purchasePrice?.toString() || "0",
        notes: notes,
      });

      router.push(`/purchase-orders/create?${params.toString()}`);
      onClose();
    } catch (error) {
      console.error("Error navigating to create purchase order:", error);
      toast.error("Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 dark:bg-gray-900/75"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900 mx-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Đặt mua nguyên liệu
        </h2>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Sản phẩm:</span> {product.productName}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">SKU:</span> {product.sku}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Đơn vị:</span> {product.unit}
            </p>
          </div>

          {/* Supplier Selection */}
          <div>
            <Label htmlFor="supplier">
              Nhà cung cấp <span className="text-red-500">*</span>
            </Label>
            <SearchableSelect
              options={[
                { value: "", label: "-- Chọn nhà cung cấp --" },
                ...suppliers.map((supplier) => ({
                  value: supplier.id,
                  label: supplier.supplierName,
                })),
              ]}
              value={supplierId?.toString() || ""}
              onChange={(value) => {
                setSupplierId(value === "" ? undefined : Number(value));
              }}
              placeholder="Tìm nhà cung cấp..."
              isClearable={false}
            />
          </div>

          {/* Quantity */}
          <div>
            <Label htmlFor="quantity">
              Số lượng <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="1"
              placeholder="Nhập số lượng"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {/* Unit Price */}
          <div>
            <Label htmlFor="unitPrice">
              Đơn giá (VNĐ){" "}
              <span className="text-xs text-gray-500">(Tùy chọn)</span>
            </Label>
            <Input
              id="unitPrice"
              type="number"
              min="0"
              step="1000"
              placeholder="Để trống để dùng giá vốn hiện tại"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">
              Ghi chú <span className="text-xs text-gray-500">(Tùy chọn)</span>
            </Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="Nhập ghi chú thêm..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleRestock}
              className="flex-1"
              isLoading={isLoading}
              disabled={!quantity || !supplierId}
            >
              <ShoppingCart className="h-4 w-4" />
              Đặt mua
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

