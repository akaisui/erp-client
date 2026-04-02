'use client';

import React, { useState } from 'react';
import { useQuickAdjustInventory } from '@/hooks/api/useQuickAdjustInventory';
import { X, Loader2 } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import toast from 'react-hot-toast';

interface QuickAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: number;
  productId: number;
  productName?: string;
  warehouseName?: string;
  currentQuantity?: number;
}

export const QuickAdjustModal: React.FC<QuickAdjustModalProps> = ({
  isOpen,
  onClose,
  warehouseId,
  productId,
  productName = 'N/A',
  warehouseName = 'N/A',
  currentQuantity = 0,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'disposal' | 'stocktake'>('disposal');
  const [quantity, setQuantity] = useState('');
  const [actualQuantity, setActualQuantity] = useState('');
  const [reason, setReason] = useState('');

  const { mutate: quickAdjust, isPending } = useQuickAdjustInventory();

  const handleSubmit = () => {
    // Validation
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do');
      return;
    }

    if (adjustmentType === 'disposal') {
      if (!quantity || Number(quantity) <= 0) {
        toast.error('Vui lòng nhập số lượng hủy > 0');
        return;
      }
      if (Number(quantity) > currentQuantity) {
        toast.error(
          `Số lượng hủy (${quantity}) không thể vượt quá tồn kho hiện tại (${currentQuantity})`
        );
        return;
      }
    } else if (adjustmentType === 'stocktake') {
      if (actualQuantity === '' || Number(actualQuantity) < 0) {
        toast.error('Vui lòng nhập số lượng thực tế >= 0');
        return;
      }
    }

    quickAdjust(
      {
        warehouseId,
        productId,
        adjustmentType,
        quantity: adjustmentType === 'disposal' ? Number(quantity) : 0,
        actualQuantity: adjustmentType === 'stocktake' ? Number(actualQuantity) : undefined,
        reason,
      },
      {
        onSuccess: () => {
          toast.success('Điều chỉnh tồn kho thành công!');
          onClose();
          // Reset form
          setQuantity('');
          setActualQuantity('');
          setReason('');
          setAdjustmentType('disposal');
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Lỗi điều chỉnh tồn kho');
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100 p-6 dark:border-gray-700 dark:from-gray-800 dark:to-gray-700">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                ✏️ Điều chỉnh tồn kho
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {productName} - {warehouseName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
              disabled={isPending}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Current Quantity Info */}
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="text-sm text-blue-700 dark:text-blue-400">Tồn kho hiện tại:</p>
              <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                {currentQuantity}
              </p>
            </div>

            {/* Adjustment Type Selection */}
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Loại điều chỉnh: <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {/* Disposal Option */}
                <label className="flex items-center rounded-lg border-2 p-3 cursor-pointer transition"
                  style={{
                    borderColor: adjustmentType === 'disposal' ? '#3b82f6' : '#d1d5db',
                    backgroundColor: adjustmentType === 'disposal' ? '#eff6ff' : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    value="disposal"
                    checked={adjustmentType === 'disposal'}
                    onChange={(e) => setAdjustmentType(e.target.value as 'disposal' | 'stocktake')}
                    className="h-4 w-4"
                  />
                  <span className="ml-3 flex-1">
                    <span className="block font-medium text-gray-900 dark:text-white">
                      Xuất hủy (Disposal)
                    </span>
                    <span className="block text-sm text-gray-600 dark:text-gray-400">
                      Hàng bị vỡ, hỏng, hết hạn
                    </span>
                  </span>
                </label>

                {/* Stocktake Option */}
                <label className="flex items-center rounded-lg border-2 p-3 cursor-pointer transition"
                  style={{
                    borderColor: adjustmentType === 'stocktake' ? '#3b82f6' : '#d1d5db',
                    backgroundColor: adjustmentType === 'stocktake' ? '#eff6ff' : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    value="stocktake"
                    checked={adjustmentType === 'stocktake'}
                    onChange={(e) => setAdjustmentType(e.target.value as 'disposal' | 'stocktake')}
                    className="h-4 w-4"
                  />
                  <span className="ml-3 flex-1">
                    <span className="block font-medium text-gray-900 dark:text-white">
                      Kiểm kê nhanh (Stocktake)
                    </span>
                    <span className="block text-sm text-gray-600 dark:text-gray-400">
                      Số liệu phần mềm sai lệch so với thực tế
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* Input Fields */}
            {adjustmentType === 'disposal' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Số lượng hủy: <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ví dụ: 5"
                  min="0"
                  max={currentQuantity}
                  disabled={isPending}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            )}

            {adjustmentType === 'stocktake' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Số lượng thực tế: <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Hệ thống</p>
                    <input
                      type="text"
                      value={currentQuantity}
                      disabled
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    />
                  </div>
                  <div className="flex items-center text-gray-400">→</div>
                  <div className="flex-1">
                    <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">Thực tế</p>
                    <input
                      type="number"
                      value={actualQuantity}
                      onChange={(e) => setActualQuantity(e.target.value)}
                      placeholder="Ví dụ: 12"
                      min="0"
                      disabled={isPending}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
                {actualQuantity !== '' && (
                  <p className="mt-2 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Chênh lệch: </span>
                    <span
                      className={
                        Number(actualQuantity) - currentQuantity > 0
                          ? 'font-semibold text-green-600 dark:text-green-400'
                          : 'font-semibold text-red-600 dark:text-red-400'
                      }
                    >
                      {Number(actualQuantity) - currentQuantity > 0 ? '+' : ''}
                      {Number(actualQuantity) - currentQuantity}
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Reason Field */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Lý do: <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  adjustmentType === 'disposal'
                    ? 'Ví dụ: Vỡ khi vận chuyển, Hết hạn...'
                    : 'Ví dụ: Đếm lại thấy thừa 2 cái...'
                }
                disabled={isPending}
                maxLength={255}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {reason.length}/255 ký tự
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
                'Xác nhận'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
