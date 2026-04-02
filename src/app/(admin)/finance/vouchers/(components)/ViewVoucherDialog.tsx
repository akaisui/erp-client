"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { Can } from "@/components/auth/Can";
import {
  usePaymentVoucher,
  useApprovePaymentVoucher,
  usePostPaymentVoucher,
  useUnpostPaymentVoucher,
  useDeletePaymentVoucher,
} from "@/hooks/api";
import { ApiResponse, PaymentVoucher } from "@/types";
import {
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
  Edit,
  ArrowLeft,
  X,
  User as UserIcon,
} from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { PaymentVoucherTemplate } from "@/components/finance/print/PaymentVoucherTemplate";

interface ViewVoucherDialogProps {
  isOpen: boolean;
  onClose: () => void;
  voucherId: number | null;
  onEdit: (id: number) => void;
}

export function ViewVoucherDialog({
  isOpen,
  onClose,
  voucherId,
  onEdit,
}: ViewVoucherDialogProps) {
  const { data: voucherWrapper, isLoading } = usePaymentVoucher(voucherId!, isOpen);
  const dataWrapper = voucherWrapper as unknown as ApiResponse<PaymentVoucher>;
  const voucher = dataWrapper?.data;

  const approveVoucher = useApprovePaymentVoucher();
  const postVoucher = usePostPaymentVoucher();
  const unpostVoucher = useUnpostPaymentVoucher();
  const deleteVoucher = useDeletePaymentVoucher();

  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showUnpostDialog, setShowUnpostDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  // New logic: Print in-page
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Phieu-chi-${voucher?.voucherCode || "print"}`,
  });

  /* Logic cũ: Mở tab mới
  const handlePrint = () => {
    if (voucherId) {
      window.open(`/finance/vouchers/${voucherId}/print`, "_blank");
    }
  };
  */

  if (!isOpen) return null;

  const handleConfirmApprove = async (notes?: string) => {
    if (voucher) {
      await approveVoucher.mutateAsync({
        id: voucher.id,
        data: notes ? { notes } : undefined,
      });
      setShowApproveDialog(false);
    }
  };

  const handleConfirmPost = async (notes?: string) => {
    if (voucher) {
      await postVoucher.mutateAsync({
        id: voucher.id,
        data: notes ? { notes } : undefined,
      });
      setShowPostDialog(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (voucher) {
      await deleteVoucher.mutateAsync(voucher.id);
      setShowDeleteDialog(false);
      onClose();
    }
  };

  const handleConfirmUnpost = async () => {
    if (voucher) {
      await unpostVoucher.mutateAsync(voucher.id);
      setShowUnpostDialog(false);
    }
  };

  const voucherTypeLabels: Record<string, string> = {
    salary: "Chi lương",
    operating_cost: "Chi phí vận hành",
    supplier_payment: "Thanh toán NCC",
    refund: "Hoàn tiền",
    other: "Chi khác",
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        className="!max-w-none w-[90vw] h-[90vh] flex flex-col p-0 overflow-hidden"
        showCloseButton={true}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Chi tiết phiếu chi {voucher?.voucherCode}
              </h2>
              {voucher && (
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ngày tạo: {format(new Date(voucher.createdAt), "dd/MM/yyyy HH:mm")}
                  </p>
                  {/* Badge Duyệt */}
                  {voucher.approvedAt ? (
                    <Badge
                      color="blue"
                      variant="light"
                      size="sm"
                      startIcon={<CheckCircle className="h-3 w-3" />}
                    >
                      Đã duyệt
                    </Badge>
                  ) : (
                    <Badge
                      color="gray"
                      variant="light"
                      size="sm"
                      startIcon={<Clock className="h-3 w-3" />}
                    >
                      Chờ duyệt
                    </Badge>
                  )}

                  {/* Badge Ghi sổ */}
                  {voucher.isPosted ? (
                    <Badge
                      color="green"
                      variant="light"
                      size="sm"
                      startIcon={<Lock className="h-3 w-3" />}
                    >
                      Đã ghi sổ
                    </Badge>
                  ) : (
                    <Badge color="gray" variant="light" size="sm">
                      Chưa ghi sổ
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mr-8">
             {/* In phiếu */}
             <Button
                variant="outline"
                size="ssmm"
                onClick={handlePrint}
                disabled={!voucher}
            >
                <Printer className="h-4 w-4" /> In phiếu
            </Button>

            {/* Chỉnh sửa - chỉ khi chưa ghi sổ */}
            {voucher && !voucher.isPosted && !voucher.approvedAt && (
                <Can permission="update_payment_voucher">
                    <Button
                        variant="primary"
                        size="ssmm"
                        onClick={() => {
                            onClose();
                            onEdit(voucher.id);
                        }}
                    >
                        <Edit className="h-4 w-4" /> Chỉnh sửa
                    </Button>
                </Can>
            )}

            {/* Phê duyệt - chỉ khi chưa duyệt */}
            {voucher && !voucher.approvedAt && (
                <Can permission="approve_payment">
                    <Button
                        variant="success"
                        size="ssmm"
                        onClick={() => setShowApproveDialog(true)}
                        isLoading={approveVoucher.isPending}
                    >
                        <CheckCircle className="h-4 w-4" /> Phê duyệt
                    </Button>
                </Can>
            )}

            {/* Ghi sổ - khi đã duyệt nhưng chưa ghi */}
            {voucher && voucher.approvedAt && !voucher.isPosted && (
                <Can permission="post_payment_voucher">
                    <Button
                        variant="primary"
                        size="ssmm"
                        onClick={() => setShowPostDialog(true)}
                        isLoading={postVoucher.isPending}
                    >
                        <Lock className="h-4 w-4" /> Ghi sổ
                    </Button>
                </Can>
            )}
             {/* Bỏ ghi sổ */}
             {voucher && voucher.isPosted && (
                 <Can permission="post_payment_voucher">
                     <Button
                         variant="warning"
                         size="ssmm"
                         onClick={() => setShowUnpostDialog(true)}
                         isLoading={unpostVoucher.isPending}
                     >
                         <Lock className="h-4 w-4" /> Bỏ ghi sổ
                     </Button>
                 </Can>
             )}

            {/* Xóa - chỉ khi chưa ghi sổ */}
            {voucher && !voucher.isPosted && (
                <Can permission="delete_payment_voucher">
                    <Button
                        variant="danger"
                        size="ssmm"
                        onClick={() => setShowDeleteDialog(true)}
                    >
                        <Trash2 className="h-4 w-4" /> Xóa
                    </Button>
                </Can>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
          {isLoading ? (
            <div className="flex flex-col h-full items-center justify-center text-gray-400 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
              <p className="font-medium">Đang tải chi tiết...</p>
            </div>
          ) : !voucher ? (
            <div className="flex h-full items-center justify-center text-gray-500 flex-col gap-2">
              <Info className="h-10 w-10 text-gray-300" />
              <span className="font-medium">Không tìm thấy dữ liệu.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 max-w-7xl mx-auto">
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                    <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                      <FileText className="h-5 w-5 text-blue-500" /> Thông tin chi tiết
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                    <InfoItem
                      label="Loại chứng từ"
                      value={voucherTypeLabels[voucher.voucherType] || voucher.voucherType}
                    />
                    <InfoItem
                      label="Tài khoản chi phí"
                      value={voucher.expenseAccount || "---"}
                    />
                    <InfoItem
                      label="Ngày thanh toán"
                      value={format(new Date(voucher.paymentDate), "dd/MM/yyyy")}
                      icon={<Calendar className="h-4 w-4" />}
                    />
                    <InfoItem
                      label="Phương thức"
                      value={`${
                        voucher.paymentMethod === "transfer" ? "Chuyển khoản" : "Tiền mặt"
                      }${ 
                        voucher.paymentMethod === "transfer" && voucher.bankName
                          ? ` - ${voucher.bankName}`
                          : ""
                      }`}
                      icon={<CreditCard className="h-4 w-4" />}
                    />

                    {/* Nhà cung cấp */}
                    <div className="sm:col-span-2">
                      {voucher.supplier ? (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 uppercase">
                            Nhà cung cấp
                          </p>
                          <Link
                            href={`/suppliers/${voucher.supplier.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            onClick={onClose}
                          >
                            {voucher.supplier.supplierName} ({voucher.supplier.supplierCode})
                          </Link>
                        </div>
                      ) : (
                        <InfoItem label="Nhà cung cấp" value="---" />
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <InfoItem
                        label="Nội dung / Ghi chú"
                        value={voucher.notes || "---"}
                      />
                    </div>
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
                      <div className="relative">
                        <span className="absolute -left-[25px] flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 ring-4 ring-white dark:bg-blue-900 dark:ring-gray-800">
                          <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                        </span>
                        <p className="text-base font-medium text-gray-900 dark:text-white">
                          Người lập phiếu
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {voucher.creator?.fullName} ({voucher.creator?.employeeCode})
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(voucher.createdAt), "dd/MM/yyyy HH:mm:ss")}
                        </p>
                      </div>

                      {voucher.approvedAt && (
                        <div className="relative">
                          <span className="absolute -left-[25px] flex h-4 w-4 items-center justify-center rounded-full bg-green-100 ring-4 ring-white dark:bg-green-900 dark:ring-gray-800">
                            <div className="h-2 w-2 rounded-full bg-green-600"></div>
                          </span>
                          <p className="text-base font-medium text-gray-900 dark:text-white">
                            Người phê duyệt
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {voucher.approver?.fullName} ({voucher.approver?.employeeCode})
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(voucher.approvedAt), "dd/MM/yyyy HH:mm:ss")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Cột phải */}
              <div className="space-y-6">
                {/* Card Tổng tiền chi */}
                <div className="rounded-xl bg-orange-500 p-6 text-white shadow-lg shadow-red-200 dark:shadow-none">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-red-100">Tổng tiền chi</p>
                    <Banknote className="h-6 w-6 text-red-200" />
                  </div>
                  <p className="mt-2 text-3xl font-bold">
                    {Number(voucher.amount).toLocaleString("vi-VN")}
                    <span className="text-lg">₫</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={handleConfirmApprove}
        title="Phê duyệt phiếu chi"
        message={`Phê duyệt phiếu chi ${voucher?.voucherCode}?\n\nCông nợ nhà cung cấp sẽ được cập nhật tự động (nếu có).`}
        confirmText="Phê duyệt"
        variant="success"
        isLoading={approveVoucher.isPending}
        showNotes={true}
      />

      <ConfirmDialog
        isOpen={showPostDialog}
        onClose={() => setShowPostDialog(false)}
        onConfirm={handleConfirmPost}
        title="Ghi sổ phiếu chi"
        message={`Ghi sổ phiếu chi ${voucher?.voucherCode}?\n\nSau khi ghi sổ, phiếu chi sẽ được cập nhật vào quỹ tiền mặt, công nợ nhà cung cấp và trạng thái lương.`}
        confirmText="Ghi sổ"
        variant="success"
        isLoading={postVoucher.isPending}
        showNotes={true}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa phiếu chi"
        message={`Bạn có chắc chắn muốn xóa phiếu chi ${voucher?.voucherCode}?\n\nThao tác này không thể hoàn tác.`}
        confirmText="Xóa"
        variant="danger"
        isLoading={deleteVoucher.isPending}
      />
      
      <ConfirmDialog
        isOpen={showUnpostDialog}
        onClose={() => setShowUnpostDialog(false)}
        onConfirm={handleConfirmUnpost}
        title="Bỏ ghi sổ phiếu chi"
        message={`Bạn có chắc chắn muốn bỏ ghi sổ phiếu chi ${voucher?.voucherCode}?\n\nDữ liệu quỹ tiền mặt, công nợ nhà cung cấp và trạng thái lương sẽ được khôi phục.`}
        confirmText="Bỏ ghi sổ"
        variant="warning"
        isLoading={unpostVoucher.isPending}
      />

      {/* Hidden Print Template */}
      <div style={{ display: "none" }}>
        <PaymentVoucherTemplate ref={printRef} voucher={voucher || null} />
      </div>
    </>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: { 
  label: string;
  value: any;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
      <div className="flex items-center gap-2 text-base text-gray-900 dark:text-gray-200 font-medium">
        {icon && <span className="text-gray-400">{icon}</span>}
        {value}
      </div>
    </div>
  );
}
