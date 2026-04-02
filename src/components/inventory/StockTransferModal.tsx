'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateStockTransfer, useWarehouses } from '@/hooks/api';
import { X, Loader2, Trash2 } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import toast from 'react-hot-toast';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { ApiResponse, CreateStockTransferRequest, Warehouse } from '@/types';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromWarehouseId: number;
  fromWarehouseName: string;
  productId: number;
  productName: string;
  currentQuantity: number;
}

interface TransferItem {
  productId: number;
  productName?: string;
  quantity: number;
  batchNumber?: string;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  isOpen,
  onClose,
  fromWarehouseId,
  fromWarehouseName,
  productId,
  productName,
  currentQuantity,
}) => {
  const router = useRouter();
  const [toWarehouseId, setToWarehouseId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<TransferItem[]>([
    { productId, productName, quantity: 0 },
  ]);

  const { data: warehousesWrapper } = useWarehouses();
  const warehouses = warehousesWrapper as unknown as ApiResponse<Warehouse[]>;
  const { mutate: createTransfer, isPending } = useCreateStockTransfer();

  // Filter to show only other warehouses (not from warehouse)
  const availableWarehouses = warehouses?.data?.filter(
    (w) => w.id !== fromWarehouseId
  ) || [];

  const handleUpdateItem = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Validation
    if (!toWarehouseId) {
      toast.error('Vui lòng chọn kho đích');
      return;
    }

    if (toWarehouseId === fromWarehouseId) {
      toast.error('Kho đích không được trùng kho nguồn');
      return;
    }

    if (items.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 sản phẩm');
      return;
    }

    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do chuyển kho');
      return;
    }

    // Check quantities
    for (const item of items) {
      if (item.quantity <= 0) {
        toast.error(`Số lượng phải > 0 cho sản phẩm ${item.productName}`);
        return;
      }
      if (item.productId === productId && item.quantity > currentQuantity) {
        toast.error(
          `Số lượng chuyển (${item.quantity}) vượt quá tồn kho (${currentQuantity})`
        );
        return;
      }
    }

    // Create request
    const request: CreateStockTransferRequest = {
      fromWarehouseId,
      toWarehouseId,
      reason,
      details: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        batchNumber: item.batchNumber,
      })),
    };

    createTransfer(request, {
      onSuccess: (data) => {
        onClose();
        // Reset form
        setToWarehouseId(null);
        setReason('');
        setItems([{ productId, productName, quantity: 0 }]);
        // Navigate to stock transfer details page
        router.push(`/inventory/stock-transfers/${data.id}`);
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={!isPending ? onClose : undefined}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100 p-6 dark:border-gray-700 dark:from-gray-800 dark:to-gray-700">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                🔁 Tạo phiếu chuyển kho
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Từ: {fromWarehouseName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-50"
              disabled={isPending}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* From Warehouse Info */}
            <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
              <p className="text-sm text-purple-700 dark:text-purple-400">Kho nguồn (Kho đi):</p>
              <p className="mt-1 text-lg font-bold text-purple-600 dark:text-purple-400">
                {fromWarehouseName}
              </p>
            </div>

            {/* To Warehouse Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kho đích (Kho đến): <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={availableWarehouses.map((w) => ({
                  value: w.id,
                  label: `${w.warehouseName} (${w.warehouseCode})`,
                }))}
                value={toWarehouseId || ''}
                onChange={(value) => setToWarehouseId(value as number)}
                placeholder="Chọn kho đích..."
                isDisabled={isPending}
              />
            </div>

            {/* Reason */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Lý do chuyển: <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: Chuyển để hỗ trợ sản xuất..."
                disabled={isPending}
                maxLength={255}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {reason.length}/255 ký tự
              </p>
            </div>

            {/* Items Table */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sản phẩm cần chuyển: <span className="text-red-500">*</span>
              </label>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                        Sản phẩm
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                        Số lượng
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                        Lô hàng
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                      >
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                          {item.productName}
                          {idx === 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                              (Tồn: {currentQuantity})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(idx, Number(e.target.value))
                            }
                            placeholder="0"
                            min="0"
                            max={idx === 0 ? currentQuantity : undefined}
                            disabled={isPending}
                            className="w-20 rounded border border-gray-300 px-2 py-1 text-center text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.batchNumber || ''}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[idx].batchNumber = e.target.value;
                              setItems(newItems);
                            }}
                            placeholder="LOT-xxx"
                            disabled={isPending}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            disabled={items.length === 1 || isPending}
                            className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Tổng sản phẩm: {items.length}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <Button
              onClick={onClose}
              variant="outline"
              size="ssmm"
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              variant="primary"
              size="ssmm"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Tạo phiếu'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
