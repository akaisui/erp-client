"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStockTransaction, useApproveTransaction, useCancelTransaction } from "@/hooks/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import CancelModal from "@/components/ui/modal/CancelModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  Printer,
  ArrowLeft,
  FileText,
  Clock,
  User,
  AlertCircle,
} from "lucide-react";
import { Can } from "@/components/auth";
import { StockTransaction } from "@/types";

export default function TransactionDetailPage() {
  const params = useParams();
  const transactionId = parseInt(params.id as string);

  const { data: response, isLoading } = useStockTransaction(transactionId);
  const approve = useApproveTransaction();
  const cancel = useCancelTransaction();

  // Modal states
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const transaction = response?.data as unknown as StockTransaction;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">Không tìm thấy giao dịch</p>
      </div>
    );
  }

  const getTransactionTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      import: "Nhập kho",
      export: "Xuất kho",
      transfer: "Chuyển kho",
      disposal: "Xuất hủy",
      stocktake: "Kiểm kê",
    };
    return map[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: "Nháp",
      pending: "Chờ duyệt",
      approved: "Đã duyệt",
      completed: "Hoàn thành",
      cancelled: "Hủy",
    };
    return map[status] || status;
  };

  const getReferenceLink = (type: string, id: number) => {
    if (type === "sales_order") return `/sales/orders/${id}`;
    if (type === "production_order") return `/production/orders/${id}`;
    return "#";
  };

  const getReferenceLabel = (type: string, id: number) => {
    if (type === "sales_order") return `Đơn hàng #${id}`;
    if (type === "production_order") return `Lệnh SX #${id}`;
    return `Ref #${id}`;
  };

  const handleApprove = () => {
    approve.mutate({ id: transactionId }, {
      onSuccess: () => {
        setShowApproveDialog(false);
      }
    });
  };

  const handleCancel = (reason: string) => {
    cancel.mutate({ id: transactionId, reason }, {
      onSuccess: () => {
        setShowCancelModal(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {transaction.transactionCode}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {getTransactionTypeLabel(transaction.transactionType)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Back Button */}
          <Link
            href="/inventory/transactions"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>

          {/* Print Button */}
          <Link
            href={`/inventory/transactions/${transactionId}/print`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Printer className="h-4 w-4" />
            In phiếu
          </Link>

          {/* Approve Button */}
          <Can permission="approve_stock_transaction">
            {transaction.status === "pending" && (
              <Button
                variant="primary"
                size="ssm"
                onClick={() => setShowApproveDialog(true)}
                isLoading={approve.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Phê duyệt
              </Button>
            )}
          </Can>

          {/* Cancel Button */}
          {transaction.status !== "completed" && transaction.status !== "cancelled" && (
            <Button
              variant="danger"
              size="ssm"
              onClick={() => setShowCancelModal(true)}
              isLoading={cancel.isPending}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Hủy
            </Button>
          )}

          {/* Status Badge */}
          <Badge
            variant="light"
            color={
                transaction.status === "completed"
                ? "success"
                : transaction.status === "approved"
                    ? "info"
                    : transaction.status === "pending"
                    ? "warning"
                    : transaction.status === "cancelled"
                        ? "error"
                        : "gray"
            }
            >
            {getStatusBadge(transaction.status)}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Thông tin giao dịch
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Loại giao dịch</p>
                <p className="font-medium">{getTransactionTypeLabel(transaction.transactionType)}</p>
              </div>

              {transaction.warehouse && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {transaction.transactionType === "transfer" ? "Kho" : "Kho đích"}
                  </p>
                  <Link
                    href={`/inventory/warehouse/${transaction.warehouse.id}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {transaction.warehouse.warehouseName}
                  </Link>
                </div>
              )}

              {transaction.sourceWarehouse && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Kho nguồn</p>
                  <Link
                    href={`/inventory/warehouse/${transaction.sourceWarehouse.id}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {transaction.sourceWarehouse.warehouseName}
                  </Link>
                </div>
              )}

              {transaction.destinationWarehouse && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Kho đích</p>
                  <Link
                    href={`/inventory/warehouse/${transaction.destinationWarehouse.id}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {transaction.destinationWarehouse.warehouseName}
                  </Link>
                </div>
              )}

              {/* Reference Link */}
              {transaction.referenceType && transaction.referenceId && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tham chiếu</p>
                  <Link
                    href={getReferenceLink(transaction.referenceType, transaction.referenceId)}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {getReferenceLabel(transaction.referenceType, transaction.referenceId)}
                  </Link>
                </div>
              )}

              {transaction.reason && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Lý do</p>
                  <p className="font-medium">{transaction.reason}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ngày tạo</p>
                <p className="font-medium">{formatDate(transaction.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Transaction Notes */}
          {transaction.notes && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-800 dark:text-yellow-500">Ghi chú</p>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                    {transaction.notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Items Table */}
          {transaction.details && transaction.details.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Chi tiết sản phẩm
              </h2>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Sản phẩm</TableCell>
                      <TableCell>Số lượng</TableCell>
                      <TableCell>Batch/Lô</TableCell>
                      <TableCell>HSD</TableCell>
                      <TableCell>Đơn giá</TableCell>
                      <TableCell>Thành tiền</TableCell>
                      <TableCell>Ghi chú</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transaction.details.map((detail, index) => {
                      const itemTotal = (Number(detail.quantity) || 0) * (Number(detail.unitPrice) || 0);
                      return (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <div>
                              <Link
                                href={`/products/${detail.product?.id}`}
                                className="font-medium text-sm text-blue-600 hover:underline dark:text-blue-400"
                              >
                                {detail.product?.productName}
                              </Link>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {detail.product?.sku}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{detail.quantity}</span>
                            {detail.product?.unit && (
                              <span className="ml-1 text-xs text-gray-500">
                                {detail.product.unit}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {detail.batchNumber || "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {detail.expiryDate ? (
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {formatDate(detail.expiryDate)}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>{formatCurrency(detail.unitPrice || 0)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(itemTotal)}
                          </TableCell>
                          <TableCell>
                            {detail.notes ? (
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {detail.notes}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Lịch sử thao tác
            </h2>

            <div className="space-y-4">
              {/* Created */}
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Phiếu được tạo
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <User className="h-3.5 w-3.5" />
                        <span>{transaction.creator?.fullName || "N/A"}</span>
                        <Clock className="ml-2 h-3.5 w-3.5" />
                        <span>{formatDate(transaction.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Approved */}
              {transaction.approvedAt && transaction.approver && (
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/20">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Đã phê duyệt
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <User className="h-3.5 w-3.5" />
                          <span>{transaction.approver.fullName}</span>
                          <Clock className="ml-2 h-3.5 w-3.5" />
                          <span>{formatDate(transaction.approvedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancelled */}
              {transaction.cancelledAt && transaction.canceller && (
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/20">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Đã hủy
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <User className="h-3.5 w-3.5" />
                          <span>{transaction.canceller.fullName}</span>
                          <Clock className="ml-2 h-3.5 w-3.5" />
                          <span>{formatDate(transaction.cancelledAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Summary */}
        <div>
          <div className="sticky top-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Tóm tắt
            </h3>

            <div className="space-y-3 border-b border-gray-200 pb-4 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Số lượng:</span>
                <span className="font-semibold">
                  {transaction.details?.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0) || 0}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tổng giá trị:</span>
                <span className="font-semibold">
                  {formatCurrency(transaction.totalValue || 0)}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Trạng thái:</span>
                <span className="font-semibold">{getStatusBadge(transaction.status)}</span>
              </div>

              {/* Creator Info */}
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Người tạo:</span>
                <span className="font-medium">{transaction.creator?.fullName || "N/A"}</span>
              </div>

              {/* Approver Info */}
              {transaction.approver && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Người duyệt:</span>
                  <span className="font-medium">{transaction.approver.fullName}</span>
                </div>
              )}

              {/* Canceller Info */}
              {transaction.canceller && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Người hủy:</span>
                  <span className="font-medium">{transaction.canceller.fullName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approve Dialog */}
      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={handleApprove}
        title="Phê duyệt giao dịch"
        message="Bạn có chắc chắn muốn phê duyệt giao dịch này? Hành động này sẽ cập nhật tồn kho và không thể hoàn tác."
        confirmText="Phê duyệt"
        variant="info"
        isLoading={approve.isPending}
      />

      {/* Cancel Modal */}
      <CancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        isLoading={cancel.isPending}
      />
    </div>
  );
}
