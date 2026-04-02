'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useStockTransfer,
  useApproveStockTransfer,
  useCompleteStockTransfer,
  useCancelStockTransfer,
} from '@/hooks/api/useStockTransfer';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, CheckCircle, X as XIcon, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function StockTransferDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = parseInt(params.id as string);

  const { data: transfer, isLoading } = useStockTransfer(id);
  const { mutate: approve, isPending: isApprovePending } = useApproveStockTransfer();
  const { mutate: complete, isPending: isCompletePending } = useCompleteStockTransfer();
  const { mutate: cancel, isPending: isCancelPending } = useCancelStockTransfer();

  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
          <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Không tìm thấy phiếu chuyển
          </p>
          <Button onClick={() => router.back()} className="mt-4">
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const isPending = transfer.status === 'pending';
  const isInTransit = transfer.status === 'in_transit';
  const isCompleted = transfer.status === 'completed';
  const isCancelled = transfer.status === 'cancelled';

  const statusColors: Record<string, string> = {
    pending: 'yellow',
    in_transit: 'blue',
    completed: 'green',
    cancelled: 'red',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Chờ duyệt',
    in_transit: 'Đang vận chuyển',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };

  const handleApprove = () => {
    if (isPending) {
      approve({ id }, {
        onSuccess: () => {
          // Refresh page
          window.location.reload();
        },
      });
    }
  };

  const handleComplete = () => {
    if (isInTransit) {
      complete({ id }, {
        onSuccess: () => {
          window.location.reload();
        },
      });
    }
  };

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy');
      return;
    }
    cancel({ id, reason: cancelReason }, {
      onSuccess: () => {
        window.location.reload();
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Chi tiết phiếu chuyển kho
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Mã phiếu: {transfer.transferCode}
              </p>
            </div>
          </div>
          <Badge color={statusColors[transfer.status]}>
            {statusLabels[transfer.status]}
          </Badge>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Transfer Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Warehouse Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🏭 Thông tin kho
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Kho nguồn (Đi)</p>
                  <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                    {transfer.fromWarehouse.warehouseName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {transfer.fromWarehouse.warehouseCode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Kho đích (Đến)</p>
                  <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                    {transfer.toWarehouse.warehouseName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {transfer.toWarehouse.warehouseCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📅 Lịch sử trạng thái
              </h2>
              <div className="space-y-4">
                {/* Giai đoạn 1: Pending */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`rounded-full p-2 ${isPending || isInTransit || isCompleted ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-gray-200 text-gray-600 dark:bg-gray-700'}`}>
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div className={`my-2 h-8 w-0.5 ${isInTransit || isCompleted ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                  </div>
                  <div className="pb-4">
                    <p className="font-semibold text-gray-900 dark:text-white">Tạo phiếu</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(transfer.createdAt), 'dd/MM/yyyy HH:mm')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Bởi: {transfer.requestedBy.fullName}
                    </p>
                  </div>
                </div>

                {/* Giai đoạn 2: In Transit */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`rounded-full p-2 ${isInTransit || isCompleted ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-gray-200 text-gray-600 dark:bg-gray-700'}`}>
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div className={`my-2 h-8 w-0.5 ${isCompleted ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                  </div>
                  <div className="pb-4">
                    <p className="font-semibold text-gray-900 dark:text-white">Duyệt & xuất kho</p>
                    {isInTransit || isCompleted ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {transfer.approvedAt && format(new Date(transfer.approvedAt), 'dd/MM/yyyy HH:mm')}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Chưa diễn ra</p>
                    )}
                    {transfer.approver && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Bởi: {transfer.approver.fullName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Giai đoạn 3: Completed */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`rounded-full p-2 ${isCompleted ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-gray-200 text-gray-600 dark:bg-gray-700'}`}>
                      <CheckCircle className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Nhận hàng</p>
                    {isCompleted ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {transfer.completedAt && format(new Date(transfer.completedAt), 'dd/MM/yyyy HH:mm')}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Chưa diễn ra</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                📦 Chi tiết sản phẩm
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                        Sản phẩm
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                        Số lượng
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">
                        Lô hàng
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfer.details.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                          {item.product.productName}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                          {item.product.sku}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">
                          {Math.round(item.quantity)} {item.product.unit}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {item.batchNumber || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-4">
            {/* Giai đoạn 2 - Duyệt phiếu */}
            {isPending && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-3">
                  🚚 Giai đoạn 2: Duyệt & Xuất kho
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mb-4">
                  Xác nhận hàng sẽ được xuất khỏi kho ({transfer.fromWarehouse.warehouseName})
                </p>
                <Button
                  onClick={handleApprove}
                  disabled={isApprovePending}
                  variant="primary"
                  className="w-full"
                >
                  {isApprovePending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    '✅ Duyệt & Xuất'
                  )}
                </Button>
              </div>
            )}

            {/* Giai đoạn 3 - Nhận hàng */}
            {isInTransit && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3">
                  📥 Giai đoạn 3: Nhận hàng
                </p>
                <p className="text-xs text-green-600 dark:text-green-300 mb-4">
                  Xác nhận nhận đủ hàng tại kho đích ({transfer.toWarehouse.warehouseName})
                </p>
                <Button
                  onClick={handleComplete}
                  disabled={isCompletePending}
                  variant="primary"
                  className="w-full"
                >
                  {isCompletePending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    '✅ Nhận hàng'
                  )}
                </Button>
              </div>
            )}

            {/* Hoàn thành */}
            {isCompleted && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  ✅ Phiếu hoàn thành
                </p>
                <p className="text-xs text-green-600 dark:text-green-300 mt-2">
                  Hàng đã được nhận và cập nhật vào tồn kho
                </p>
              </div>
            )}

            {/* Hủy phiếu */}
            {!isCompleted && !isCancelled && (
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <button
                  onClick={() => setShowCancelForm(!showCancelForm)}
                  className="w-full text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  ❌ Hủy phiếu chuyển
                </button>

                {showCancelForm && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Lý do hủy..."
                      maxLength={255}
                      rows={3}
                      disabled={isCancelPending}
                      className="w-full rounded border border-gray-300 px-2 py-2 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCancel}
                        disabled={isCancelPending || !cancelReason.trim()}
                        variant="danger"
                        size="ssmm"
                        className="flex-1"
                      >
                        {isCancelPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Xác nhận hủy'}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowCancelForm(false);
                          setCancelReason('');
                        }}
                        variant="secondary"
                        size="ssmm"
                        className="flex-1"
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Lý do chuyển */}
            {transfer.reason && (
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  📝 Lý do chuyển
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {transfer.reason}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
