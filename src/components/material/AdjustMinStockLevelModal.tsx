"use client";

import React, { useState, useEffect } from "react";
import { useUpdateProduct } from "@/hooks/api";
import { Product } from "@/types";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Settings, X } from "lucide-react";
import { toast } from "react-hot-toast";

interface AdjustMinStockLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: () => void;
}

export function AdjustMinStockLevelModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: AdjustMinStockLevelModalProps) {
  const [minStockLevel, setMinStockLevel] = useState<string>(
    product.minStockLevel?.toString() || "0"
  );
  const [errorMsg, setErrorMsg] = useState("");

  const updateProduct = useUpdateProduct();

  useEffect(() => {
    setMinStockLevel(product.minStockLevel?.toString() || "0");
    setErrorMsg("");
  }, [isOpen, product.minStockLevel]);

  const handleSave = async () => {
    const level = Number(minStockLevel);

    if (isNaN(level) || level < 0) {
      setErrorMsg("Vui lòng nhập số không âm");
      return;
    }

    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data: {
          minStockLevel: level,
        } as any,
      });

      toast.success("Cập nhật định mức tồn kho tối thiểu thành công!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error updating min stock level:", error);
      toast.error("Cập nhật thất bại");
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
          Điều chỉnh định mức tồn kho
        </h2>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
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

          {/* Current Min Stock Level */}
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Định mức hiện tại:</span>{" "}
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {product.minStockLevel || 0}
              </span>
              {" "}
              {product.unit}
            </p>
          </div>

          {/* New Min Stock Level Input */}
          <div>
            <Label htmlFor="minStockLevel">
              Định mức tồn kho tối thiểu mới <span className="text-red-500">*</span>
            </Label>
            <Input
              id="minStockLevel"
              type="number"
              min="0"
              step="1"
              placeholder="Nhập số lượng tối thiểu"
              value={minStockLevel}
              onChange={(e) => {
                setMinStockLevel(e.target.value);
                setErrorMsg("");
              }}
              autoFocus
            />
            {errorMsg && (
              <p className="mt-1 text-sm text-red-600">{errorMsg}</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              📌 Khi tồn kho dưới mức này, sẽ có cảnh báo và gợi ý đặt mua
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={updateProduct.isPending}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              className="flex-1"
              isLoading={updateProduct.isPending}
            >
              <Settings className="h-4 w-4" />
              Cập nhật
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

