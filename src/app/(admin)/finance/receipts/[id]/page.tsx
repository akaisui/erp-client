"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePaymentReceipt, useApprovePaymentReceipt, useDeletePaymentReceipt, useSendEmailPaymentReceipt } from "@/hooks";
import { ApiResponse, PaymentReceipt } from "@/types";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Printer,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  Info,
  Banknote,
  Trash2,
  Lock,
  User as UserIcon,
  Mail,
  Edit,
  AlertCircle,
} from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import { format } from "date-fns";
import Button from "@/components/ui/button/Button";
import { Can } from "@/components/auth";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";

// Info Item Component
const InfoItem = ({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: string; 
  icon?: React.ReactNode;
}) => (
  <div className="space-y-1">
    <p className="flex items-center gap-1 text-xs font-medium uppercase text-gray-500">
      {icon} {label}
    </p>
    <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
      {value}
    </p>
  </div>
);

export default function PaymentReceiptDetailPage() {
  const params = useParams();
  const receiptId = parseInt(params.id as string);
  const { data: receiptWrapper, isLoading } = usePaymentReceipt(receiptId);
  const dataWrapper = receiptWrapper as unknown as ApiResponse<PaymentReceipt>;
  const receipt = dataWrapper?.data;
  console.log('receipt', receipt);

  const approveReceipt = useApprovePaymentReceipt();
  const deleteReceipt = useDeletePaymentReceipt();
  const sendEmailReceipt = useSendEmailPaymentReceipt();
  const router = useRouter();

  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSendEmailDialog, setShowSendEmailDialog] = useState(false);
  const [showCustomerTooltip, setShowCustomerTooltip] = useState(false);

  const handlePrint = async (id: number) => {
    window.open(`/finance/receipts/${id}/print`, "_blank");
  };

  const handleSendEmail = () => {
    sendEmailReceipt.mutate({ id: receipt.id }, {
      onSuccess: () => {
        setShowSendEmailDialog(false);
      },
    });
  };

  const handleEdit = () => {
    router.push(`/finance/receipts/${receipt.id}/edit`);
  };

  const handleApprove = () => {
    setShowApproveDialog(true);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmApprove = async (notes?: string) => {
    await approveReceipt.mutateAsync({
      id: receipt.id,
      data: notes ? { notes } : undefined,
    });
    setShowApproveDialog(false);
  };

  const handleConfirmDelete = async () => {
    await deleteReceipt.mutateAsync(receipt.id);
    setShowDeleteDialog(false);
    router.push("/finance/receipts");
  };

  const receiptTypeLabels: Record<string, string> = {
    sales: "Bán hàng",
    debt_collection: "Thu công nợ",
    refund: "Hoàn tiền",
    other: "Khác",
  };

  const paymentMethodLabels: Record<string, string> = {
    cash: "Tiền mặt",
    transfer: "Chuyển khoản",
    card: "Thẻ",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (!receipt) return <div className="p-6">Không tìm thấy dữ liệu...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {receipt.receiptCode}
            </h1>

            {/* Badge Duyệt */}
            {receipt.approvedAt ? (
              <Badge
                color="blue"
                variant="light"
                size="sm"
                startIcon={<CheckCircle className="h-3 w-3" />}
                title={`Duyệt bởi: ${receipt.approver?.fullName} lúc ${format(
                  new Date(receipt.approvedAt),
                  "dd/MM/yyyy HH:mm"
                )}`}
              >
                Đã duyệt
              </Badge>
            ) : (
              <Badge color="gray" variant="light" size="sm" startIcon={<Clock className="h-3 w-3" />}>
                Chờ duyệt
              </Badge>
            )}

            {/* Badge Ghi sổ */}
            {receipt.isPosted ? (
              <Badge color="green" variant="light" size="sm" startIcon={<Lock className="h-3 w-3" />}>
                Đã ghi sổ
              </Badge>
            ) : (
              <Badge color="gray" variant="light" size="sm">
                Chưa ghi sổ
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">Phiếu thu</p>
          <p className="text-sm text-gray-500">
            Ngày tạo: {format(new Date(receipt.createdAt), "dd/MM/yyyy HH:mm")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/finance/receipts"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Link>

          {/* In phiếu - Primary */}
          <Button variant="outline" size="ssmm" onClick={() => handlePrint(receipt.id)}>
            <Printer className="h-4 w-4" /> In phiếu
          </Button>

          {/* Gửi email - Secondary */}
          <Button variant="gradient" size="ssmm" onClick={() => setShowSendEmailDialog(true)}>
            <Mail className="h-4 w-4" /> Gửi email
          </Button>

          {/* Sửa - chỉ khi chưa ghi sổ */}
          {!receipt.isPosted && (
            <Can permission="update_payment_receipt">
              <Button
                variant="primary"
                size="ssmm"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" /> Sửa
              </Button>
            </Can>
          )}

          {/* Phê duyệt - chỉ khi chưa duyệt */}
          {!receipt.approvedAt && (
            <Can permission="approve_payment_receipt">
              <Button
                variant="success"
                size="ssmm"
                onClick={handleApprove}
                isLoading={approveReceipt.isPending}
              >
                <CheckCircle className="h-4 w-4" /> Phê duyệt
              </Button>
            </Can>
          )}

          {/* Xóa - chỉ khi chưa ghi sổ */}
          {!receipt.isPosted && (
            <Can permission="delete_payment_receipt">
              <Button
                variant="danger"
                size="ssmm"
                onClick={handleDelete}
                isLoading={deleteReceipt.isPending}
              >
                <Trash2 className="h-4 w-4" /> Xóa
              </Button>
            </Can>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin chi tiết */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 p-4 dark:border-gray-700">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <FileText className="h-5 w-5 text-blue-500" /> Thông tin phiếu thu
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <InfoItem
                label="Loại phiếu"
                value={receiptTypeLabels[receipt.receiptType] || receipt.receiptType}
              />
              <InfoItem
                label="Phương thức"
                value={`${paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod}${
                  receipt.bankName ? ` - ${receipt.bankName}` : ""
                }`}
                icon={<CreditCard className="h-4 w-4" />}
              />
              <InfoItem
                label="Ngày thu"
                value={format(new Date(receipt.receiptDate), "dd/MM/yyyy")}
                icon={<Calendar className="h-4 w-4" />}
              />
              <InfoItem
                label="Số tiền"
                value={`${new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(Number(receipt.amount))}`}
                icon={<Banknote className="h-4 w-4" />}
              />

              {/* Khách hàng - với link và tooltip */}
              <div className="sm:col-span-2">
                {receipt.customerRef ? (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                      <UserIcon className="h-3 w-3" /> Khách hàng
                    </p>
                    <TooltipProvider>
                      <Tooltip open={showCustomerTooltip} onOpenChange={setShowCustomerTooltip}>
                        <TooltipTrigger asChild>
                          <Link
                            href={`/customers/${receipt.customerRef.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
                          >
                            {receipt.customerRef.customerName} ({receipt.customerRef.customerCode})
                            <AlertCircle className="h-3 w-3" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 p-4 rounded-lg text-sm space-y-2 shadow-lg">
                          <div className="flex justify-between gap-4">
                            <span>Công nợ hiện tại:</span>
                            <span className="font-bold text-red-500">{formatCurrency(receipt.customerRef.currentDebt || 0)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span>Hạn mức tín dụng:</span>
                            <span className="font-bold text-green-500">{formatCurrency(receipt.customerRef.creditLimit || 0)}</span>
                          </div>
                          <div className="flex justify-between gap-4 pt-2 border-t border-gray-300 dark:border-gray-600">
                            <span>Có thể vay thêm:</span>
                            <span className="font-bold text-blue-500">{formatCurrency(Math.max(0, Number(receipt.customerRef.creditLimit || 0) - Number(receipt.customerRef.currentDebt || 0)))}</span>
                          </div>
                          {receipt.customerRef.phone && (
                            <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                              <p className="text-xs text-gray-600 dark:text-gray-400">SĐT: {receipt.customerRef.phone}</p>
                            </div>
                          )}
                          {receipt.customerRef.address && (
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">Địa chỉ: {receipt.customerRef.address}</p>
                            </div>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ) : (
                  <InfoItem label="Khách hàng" value="---" />
                )}
              </div>

              {/* Đơn hàng liên quan */}
              {receipt.order && (
                <div className="sm:col-span-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Đơn hàng liên quan
                    </p>
                    <Link
                      href={`/sales/orders/${receipt.order.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {receipt.order.orderCode}
                    </Link>
                  </div>
                </div>
              )}

              {/* Mã tham chiếu */}
              {receipt.transactionReference && (
                <div className="sm:col-span-2">
                  <InfoItem label="Mã tham chiếu (Transaction ID)" value={receipt.transactionReference} />
                </div>
              )}

              {/* Ghi chú */}
              {receipt.notes && (
                <div className="sm:col-span-2">
                  <InfoItem label="Ghi chú" value={receipt.notes} />
                </div>
              )}
            </div>
          </div>

          {/* Chi tiết thanh toán */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 p-4 dark:border-gray-700">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <Banknote className="h-5 w-5 text-green-500" /> Chi tiết thanh toán
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <div className="sm:col-span-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg">
                <p className="text-xs font-medium uppercase text-green-600 dark:text-green-400 mb-2">Số tiền thu</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(Number(receipt.amount))}
                </p>
              </div>

              <InfoItem
                label="Phương thức thanh toán"
                value={paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod}
                icon={<CreditCard className="h-4 w-4" />}
              />
              
              {receipt.bankName && (
                <InfoItem
                  label="Ngân hàng"
                  value={receipt.bankName}
                />
              )}

              {receipt.transactionReference && (
                <InfoItem
                  label="Mã giao dịch"
                  value={receipt.transactionReference}
                />
              )}

              {/* Đơn hàng liên quan - Lặp lại ở đây để tách riêng */}
              {receipt.order && (
                <div className="sm:col-span-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Đơn hàng liên quan
                    </p>
                    <Link
                      href={`/sales/orders/${receipt.order.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {receipt.order.orderCode}
                    </Link>
                    {receipt.order && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Trạng thái: <span className="font-medium">{receipt.order.paymentStatus === 'paid' ? '✓ Đã thanh toán' : receipt.order.paymentStatus === 'partial' ? '⚠️ Một phần' : '❌ Chưa thanh toán'}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 p-4 dark:border-gray-700">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <Info className="h-5 w-5 text-orange-500" /> Thông tin hệ thống
              </h2>
            </div>
            <div className="p-5">
              <div className="relative border-l-2 border-gray-100 pl-4 dark:border-gray-700 space-y-6">
                {/* Người lập */}
                <div className="relative">
                  <span className="absolute -left-[25px] flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 ring-4 ring-white dark:bg-blue-900 dark:ring-gray-800">
                    <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                  </span>
                  <p className="text-base font-medium text-gray-900 dark:text-white">Người lập phiếu</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {receipt.creator?.fullName} ({receipt.creator?.employeeCode})
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(receipt.createdAt), "dd/MM/yyyy HH:mm:ss")}
                  </p>
                </div>

                {/* Người duyệt */}
                {receipt.approvedAt && (
                  <div className="relative">
                    <span className="absolute -left-[25px] flex h-4 w-4 items-center justify-center rounded-full bg-green-100 ring-4 ring-white dark:bg-green-900 dark:ring-gray-800">
                      <div className="h-2 w-2 rounded-full bg-green-600"></div>
                    </span>
                    <p className="text-base font-medium text-gray-900 dark:text-white">Người phê duyệt</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {receipt.approver?.fullName} ({receipt.approver?.employeeCode})
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(receipt.approvedAt), "dd/MM/yyyy HH:mm:ss")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Amount Summary */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-sm dark:border-gray-700 dark:from-blue-900/20 dark:to-blue-800/20">
            <p className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">Số tiền phiếu thu</p>
            <p className="mt-2 text-3xl font-bold text-blue-900 dark:text-blue-100">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(Number(receipt.amount))}
            </p>
            <div className="mt-4 space-y-2 pt-4 border-t border-blue-200 dark:border-blue-700">
              <div className="flex justify-between text-sm">
                <span className="text-blue-700 dark:text-blue-300">Loại:</span>
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {receiptTypeLabels[receipt.receiptType]}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-700 dark:text-blue-300">PT thanh toán:</span>
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {paymentMethodLabels[receipt.paymentMethod]}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-700 dark:text-blue-300">Trạng thái:</span>
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {receipt.approvedAt ? "Đã duyệt" : "Chờ duyệt"}
                </span>
              </div>
            </div>
          </div>

          {/* Verification Status */}
          {receipt.isVerified && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/20">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">Đã xác minh</p>
                  <p className="text-xs text-green-700 dark:text-green-300">Phiếu thu đã được xác minh chính xác</p>
                </div>
              </div>
            </div>
          )}

          {/* Trạng thái Ghi sổ */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400 mb-3">Thông tin ghi sổ</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Trạng thái:</span>
                {receipt.isPosted ? (
                  <Badge color="green" variant="light" size="sm" startIcon={<CheckCircle className="h-3 w-3" />}>
                    Đã ghi sổ
                  </Badge>
                ) : (
                  <Badge color="gray" variant="light" size="sm">
                    Chưa ghi sổ
                  </Badge>
                )}
              </div>
              {receipt.isPosted && (
                <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                  ⚠️ Phiếu đã ghi sổ. Không thể sửa hoặc xóa.
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
        onConfirm={handleConfirmApprove}
        title="Phê duyệt phiếu thu"
        message={`Phê duyệt phiếu thu ${receipt?.receiptCode}?\n\nPhiếu sẽ được đánh dấu là đã duyệt và sẵn sàng để ghi sổ.`}
        confirmText="Phê duyệt"
        variant="success"
        isLoading={approveReceipt.isPending}
        showNotes={true}
      />

      {/* Send Email Dialog */}
      <ConfirmDialog
        isOpen={showSendEmailDialog}
        onClose={() => setShowSendEmailDialog(false)}
        onConfirm={handleSendEmail}
        title="Gửi biên lai điện tử"
        message={`Bạn có chắc chắn muốn gửi biên lai phiếu thu ${receipt?.receiptCode} cho khách hàng ${receipt?.customerRef?.customerName}?\n\nEmail sẽ được gửi đến địa chỉ của khách hàng.`}
        confirmText="Gửi"
        variant="info"
        isLoading={sendEmailReceipt.isPending}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa phiếu thu"
        message={`Bạn có chắc chắn muốn xóa phiếu thu ${receipt?.receiptCode}?\n\nThao tác này không thể hoàn tác.`}
        confirmText="Xóa"
        variant="danger"
        isLoading={deleteReceipt.isPending}
      />
    </div>
  );
}
