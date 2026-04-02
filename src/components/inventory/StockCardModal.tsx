'use client';

import React, { useState } from 'react';
import { useStockCard } from '@/hooks/api/useStockCard';
import { format } from 'date-fns';
import { X, Loader2 } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import { SimpleDatePicker } from '@/components/form/SimpleDatePicker';
import Link from 'next/link';
import { StockCardResponse } from '@/types';

interface StockCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: number;
  productId: number;
  productName?: string;
  warehouseName?: string;
}

export const StockCardModal: React.FC<StockCardModalProps> = ({
  isOpen,
  onClose,
  warehouseId,
  productId,
  productName = 'N/A',
  warehouseName = 'N/A',
}) => {
  // State for UI input (người dùng chọn)
  const [tempStartDate, setTempStartDate] = useState(
    format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd')
  );
  const [tempEndDate, setTempEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // State for API request (chỉ thay đổi khi bấm "Cập nhật")
  const [fetchStartDate, setFetchStartDate] = useState(tempStartDate);
  const [fetchEndDate, setFetchEndDate] = useState(tempEndDate);

  const { data, isLoading, error, refetch } = useStockCard(warehouseId, productId, {
    startDate: fetchStartDate,
    endDate: fetchEndDate,
  });

  const handleUpdate = () => {
    setFetchStartDate(tempStartDate);
    setFetchEndDate(tempEndDate);
  };

  const stockCardData = data as StockCardResponse | undefined;

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
        <div className="relative w-full max-w-5xl rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100 p-6 dark:border-gray-700 dark:from-gray-800 dark:to-gray-700">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                📜 Thẻ kho - {productName}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {warehouseName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Date Range Filter */}
            <div className="mb-6 flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[180px]">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Từ ngày:
                </label>
                <SimpleDatePicker
                  value={tempStartDate}
                  onChange={setTempStartDate}
                  placeholder="Từ ngày"
                  maxDate={tempEndDate}
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Đến ngày:
                </label>
                <SimpleDatePicker
                  value={tempEndDate}
                  onChange={setTempEndDate}
                  placeholder="Đến ngày"
                  minDate={tempStartDate}
                />
              </div>
              <Button
                onClick={handleUpdate}
                size="ssmm"
                variant="primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Cập nhật'
                )}
              </Button>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-red-800 dark:text-red-200">
                  Lỗi tải dữ liệu: {(error as any)?.message}
                </p>
              </div>
            )}

            {/* Summary Cards */}
            {stockCardData && !isLoading && (
              <>
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
                  {/* Opening Balance */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Tồn đầu kỳ
                    </p>
                    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                      {Math.round(stockCardData.openingBalance).toLocaleString()}
                    </p>
                  </div>

                  {/* Total Import */}
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400">
                      Tổng nhập
                    </p>
                    <p className="mt-1 text-lg font-bold text-green-600 dark:text-green-400">
                      +{Math.round(stockCardData.summary.totalImport).toLocaleString()}
                    </p>
                  </div>

                  {/* Total Export */}
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                    <p className="text-xs font-medium text-red-700 dark:text-red-400">
                      Tổng xuất
                    </p>
                    <p className="mt-1 text-lg font-bold text-red-600 dark:text-red-400">
                      -{Math.round(stockCardData.summary.totalExport).toLocaleString()}
                    </p>
                  </div>

                  {/* Total Disposal */}
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
                    <p className="text-xs font-medium text-orange-700 dark:text-orange-400">
                      Tổng hủy
                    </p>
                    <p className="mt-1 text-lg font-bold text-orange-600 dark:text-orange-400">
                      -{Math.round(stockCardData.summary.totalDisposal).toLocaleString()}
                    </p>
                  </div>

                  {/* Closing Balance */}
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                      Tồn cuối kỳ
                    </p>
                    <p className="mt-1 text-lg font-bold text-blue-600 dark:text-blue-400">
                      {Math.round(stockCardData.closingBalance).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                        <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                          Thời gian
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                          Mã chứng từ
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                          Diễn giải
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                          Nhập
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                          Xuất
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                          Tồn cuối
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                          Lô hàng
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockCardData.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            Không có giao dịch nào trong khoảng thời gian này
                          </td>
                        </tr>
                      ) : (
                        stockCardData.transactions.map((tx, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                          >
                            <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                              {format(new Date(tx.date), 'dd/MM/yyyy HH:mm')}
                            </td>
                            <td className="px-4 py-3">
                              <Link
                                href={`/inventory/transactions/${tx.transactionId}`}
                                className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                {tx.code}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                              {tx.description}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {tx.type === 'import' ? (
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  +{Math.round(tx.quantity).toLocaleString()}
                                </span>
                              ) : tx.type === 'transfer' && tx.quantity > 0 ? (
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                  +{Math.round(tx.quantity).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {['export', 'disposal'].includes(tx.type) ? (
                                <span className="font-semibold text-red-600 dark:text-red-400">
                                  -{Math.round(tx.quantity).toLocaleString()}
                                </span>
                              ) : tx.type === 'transfer' && tx.quantity < 0 ? (
                                <span className="font-semibold text-orange-600 dark:text-orange-400">
                                  -{Math.round(Math.abs(tx.quantity)).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-gray-900 dark:text-white">
                              {Math.round(tx.balance).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                              {tx.batchNumber || '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Stats */}
                <div className="mt-4 flex justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Tổng giao dịch:
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {stockCardData.transactions.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Thay đổi tồn kho:
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        stockCardData.closingBalance - stockCardData.openingBalance >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {stockCardData.closingBalance - stockCardData.openingBalance >= 0 ? '+' : ''}
                      {Math.round(stockCardData.closingBalance - stockCardData.openingBalance).toLocaleString()}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            <Button onClick={onClose} variant="outline" size="ssmm">
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
