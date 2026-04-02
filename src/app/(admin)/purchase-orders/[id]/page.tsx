"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  usePurchaseOrder,
  useApprovePurchaseOrder,
  useCancelPurchaseOrder,
  useSendEmailPurchaseOrder,
  useDeletePurchaseOrder,
} from "@/hooks/api";
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
  PackageCheck,
  AlertCircle,
  Calendar,
  Package,
  Building2,
  Mail,
  Trash2,
} from "lucide-react";
import { Can } from "@/components/auth";
import { PurchaseOrder } from "@/types";
import { Decimal } from "decimal.js";
import { getStatusBadge } from "@/lib/purchaseOrder";

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const poId = parseInt(params.id as string);

  const { data: response, isLoading } = usePurchaseOrder(poId);
  const approveMutation = useApprovePurchaseOrder();
  const sendEmailMutation = useSendEmailPurchaseOrder();
  const cancelMutation = useCancelPurchaseOrder();
  const { mutate: deletePoMutation, isPending: isDeleting } = useDeletePurchaseOrder();

  // Modal states
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showSendEmailDialog, setShowSendEmailDialog] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const po = response?.data as unknown as PurchaseOrder;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          Không tìm thấy đơn đặt hàng
        </p>
      </div>
    );
  }

  const handleApprove = () => {
    approveMutation.mutate(
      { id: poId },
      {
        onSuccess: () => {
          setShowApproveDialog(false);
        },
      }
    );
  };

  const handleSendEmail = () => {
    sendEmailMutation.mutate({ id: poId }, {
      onSuccess: () => {
        setShowSendEmailDialog(false);
      },
    })
  };

  const handleCancel = (reason: string) => {
    cancelMutation.mutate(
      { id: poId, reason },
      {
        onSuccess: () => {
          setShowCancelModal(false);
        },
      }
    );
  };

  const handleReceive = () => {
    router.push(`/inventory/transactions/import?po_id=${poId}`);
  };

  const handleDelete = () => {
    deletePoMutation(poId, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        router.push("/purchase-orders");
      },
    });
  };

  const statusBadge = getStatusBadge(po.status);

  // Calculate totals
  const totalQuantity = po.details?.reduce((sum, d) => sum + Number(d.quantity), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {po.poCode}
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Đơn đặt hàng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Back Button */}
          <Button
            onClick={() => router.push('/purchase-orders')}
            variant="outline"
            size="ssmm"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>

          {/* Print Button */}
          <Button
            onClick={() => router.push(`/purchase-orders/${poId}/print`)}
            size="ssmm"
            variant="outline"
          >
            <Printer className="h-4 w-4" />
            In đơn
          </Button>

          {/* Edit Button - Only for pending status */}
          <Can permission="update_purchase_order">
            {po.status === "pending" && (
              <Button
                onClick={() => router.push(`/purchase-orders/${poId}/edit`)}
                variant="primary"
                size="ssmm"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Chỉnh sửa
              </Button>
            )}
          </Can>
          <Can permission="approve_purchase_order">
            {po.status === "pending" && (
              <Button
                variant="success"
                size="ssmm"
                onClick={() => setShowApproveDialog(true)}
                isLoading={approveMutation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Phê duyệt
              </Button>
            )}
          </Can>

          {/* Send Email Button */}
          <Can permission="sendEmail_purchase_order">
            {po.status === "approved" && (
              <Button
                variant="primary"
                size="ssmm"
                onClick={() => setShowSendEmailDialog(true)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Gửi Mail NCC
              </Button>
            )}
          </Can>

          {/* Receive Button */}
          <Can permission="receive_purchase_order">
            {po.status === "approved" && !po.stockTransaction?.id && (
              <Button
                variant="primary"
                size="ssmm"
                onClick={handleReceive}
              >
                <PackageCheck className="mr-2 h-4 w-4" />
                Nhận hàng
              </Button>
            )}
          </Can>

          {/* Cancel Button */}
          {(po.status === "pending" || po.status === "approved") && (
            <Button
              variant="danger"
              size="ssmm"
              onClick={() => setShowCancelModal(true)}
              isLoading={cancelMutation.isPending}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Hủy
            </Button>
          )}

          {/* Delete Button - Only for pending status */}
          <Can permission="delete_purchase_order">
            {po.status === "pending" && (
              <Button
                variant="danger"
                size="ssmm"
                onClick={() => setShowDeleteDialog(true)}
                isLoading={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </Button>
            )}
          </Can>

          {/* Status Badge */}
          <Badge variant="light" color={statusBadge.color}>
            {statusBadge.label}
          </Badge>
        </div>
      </div>

      {/* PO Info Alert */}
      {po.status === 'approved' && po.stockTransaction?.id && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/30">
                <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-medium text-amber-800 dark:text-amber-300">
                            Đơn hàng đã được nhập kho chờ quản lý duyệt!
                        </p>
                    </div>
                </div>
            </div>
        )}
    {po.status === 'received'  && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/30">
            <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                    <p className="font-medium text-green-800 dark:text-green-300">
                        Đơn hàng đã được nhập kho thành công!
                    </p>
                </div>
            </div>
        </div>
    )}

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Purchase Order Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Thông tin đơn hàng
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Supplier */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nhà cung cấp
                </p>
                {po.supplier ? (
                  <Link
                    href={`/suppliers/${po.supplier.id}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {po.supplier.supplierName}
                  </Link>
                ) : (
                  <p className="font-medium">—</p>
                )}
              </div>

              {/* Warehouse */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Kho đích
                </p>
                {po.warehouse ? (
                  <Link
                    href={`/inventory/warehouse/${po.warehouse.id}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {po.warehouse.warehouseName}
                  </Link>
                ) : (
                  <p className="font-medium">—</p>
                )}
              </div>

              {/* Order Date */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ngày đặt hàng
                </p>
                <p className="font-medium">{formatDate(po.orderDate)}</p>
              </div>

              {/* Expected Delivery Date */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ngày giao dự kiến
                </p>
                <p className="font-medium">
                  {po.expectedDeliveryDate
                    ? formatDate(po.expectedDeliveryDate)
                    : "—"}
                </p>
              </div>

              {/* Created By */}
              {po.createdBy && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Người tạo
                  </p>
                  <p className="font-medium">{po.creator?.fullName}</p>
                </div>
              )}

              {/* Approved By */}
              {po.approver && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Người phê duyệt
                  </p>
                  <p className="font-medium">{po.approver.fullName}</p>
                </div>
              )}

              {/* Created At */}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ngày tạo
                </p>
                <p className="font-medium">{formatDate(po.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {po.notes && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-800 dark:text-yellow-500">
                    Ghi chú
                  </p>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                    {po.notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Items Table */}
          {po.details && po.details.length > 0 && (
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
                      <TableCell className="text-right">Đơn giá</TableCell>
                      <TableCell className="text-right">Thành tiền</TableCell>
                      <TableCell className="text-right">Ghi chú</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {po.details.map((detail, index) => {
                      const itemTotal =
                        Number(detail.quantity) * Number(detail.unitPrice);
                      return (
                        <TableRow key={index}>
                          <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div>
                              {detail.product ? (
                                <Link
                                  href={`/products/${detail.product.id}`}
                                  className="font-medium text-sm text-blue-600 hover:underline dark:text-blue-400"
                                >
                                  {detail.product.productName}
                                </Link>
                              ) : (
                                <span className="font-medium text-sm">
                                  Product #{detail.productId}
                                </span>
                              )}
                              {detail.product && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {detail.product.sku}
                                  {detail.product.unit &&
                                    ` • ${detail.product.unit}`}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {Number(detail.quantity).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {formatCurrency(Number(detail.unitPrice))}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(itemTotal)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {detail.notes || "—"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Summary */}
                <div className="mt-4 flex justify-end">
                  <div className="w-80 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Tổng số lượng:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {totalQuantity.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-300 pt-2 dark:border-gray-600">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Tổng giá trị:
                      </span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(Number(po.subTotal))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Summary & Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Summary Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Tóm tắt
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Số sản phẩm
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {po.details?.length || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
                  <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Tổng số lượng
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {totalQuantity.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/20">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Ngày đặt
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(po.orderDate).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Tổng giá trị
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(Number(po.subTotal))}
                </p>
              </div>

              <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                    Tiền thuế ({po.taxRate}%):
                    </span>
                    <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                    {formatCurrency(
                        new Decimal(po.subTotal).times(po.taxRate! / 100).toNumber()
                    )}
                    </span>
                </div>
                <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                    <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tổng sau thuế:
                    </span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(
                            po.totalAmount
                        )}
                    </span>
                    </div>
                </div>
            </div>
          </div>

          {/* Status Info Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Trạng thái
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Hiện tại:
                </span>
                <Badge variant="light" color={statusBadge.color}>
                  {statusBadge.label}
                </Badge>
              </div>

              {po.status === "pending" && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Đơn hàng đang chờ phê duyệt
                </p>
              )}

              {po.status === "approved" && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Đơn hàng đã được phê duyệt, chờ nhận hàng
                </p>
              )}

              {po.status === "received" && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Đơn hàng đã nhận và nhập kho thành công
                </p>
              )}

              {po.status === "cancelled" && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  Đơn hàng đã bị hủy
                </p>
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
        title="Xác nhận phê duyệt"
        message={`Bạn có chắc chắn muốn phê duyệt đơn đặt hàng ${po.poCode}?`}
        confirmText="Phê duyệt"
        variant="info"
        isLoading={approveMutation.isPending}
      />

      {/* Send Email Dialog */}
      <ConfirmDialog
        isOpen={showSendEmailDialog}
        onClose={() => setShowSendEmailDialog(false)}
        onConfirm={handleSendEmail}
        title="Xác nhận gửi email"
        message={`Bạn có chắc chắn muốn gửi email cho đơn đặt hàng ${po.poCode} cho nhà cung cấp ${po.supplier?.supplierName}?`}
        confirmText="Gửi"
        variant="info"
        isLoading={sendEmailMutation.isPending}
      />

      {/* Cancel Modal */}
      <CancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        title="Hủy đơn đặt hàng"
        message={`Bạn có chắc chắn muốn hủy đơn đặt hàng ${po.poCode}?`}
        isLoading={cancelMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Xóa đơn đặt hàng"
        message={`Bạn có chắc chắn muốn xóa đơn đặt hàng ${po.poCode}? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
