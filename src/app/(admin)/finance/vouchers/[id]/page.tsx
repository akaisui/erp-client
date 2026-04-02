"use client"
import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  useApprovePaymentVoucher, 
  usePostPaymentVoucher,
  useUnpostPaymentVoucher,
  useDeletePaymentVoucher,
  usePaymentVoucher 
} from "@/hooks";
import { ApiResponse, PaymentVoucher } from "@/types";
import Link from "next/link";
import { 
  ArrowLeft, CheckCircle, Printer, Calendar, Clock,
  CreditCard, FileText, Info, Banknote, Trash2, Lock, Edit
} from "lucide-react";
import Badge from "@/components/ui/badge/Badge";
import { format } from "date-fns";
import Button from "@/components/ui/button/Button";
import { Can } from "@/components/auth";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";

export default function PaymentVouchersDetailPage() {
    const params = useParams();
    const paymentVoucherid = parseInt(params.id as string);
    const { data: voucherWrapper, isLoading } = usePaymentVoucher(paymentVoucherid);
    const dataWrapper = voucherWrapper as unknown as ApiResponse<PaymentVoucher>;
    const voucher = dataWrapper?.data;
    const approveVoucher = useApprovePaymentVoucher();
    const postVoucher = usePostPaymentVoucher();
    const unpostVoucher = useUnpostPaymentVoucher();
    const deleteVoucher = useDeletePaymentVoucher();
    const router = useRouter();
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showPostDialog, setShowPostDialog] = useState(false);
    const [showUnpostDialog, setShowUnpostDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handlePrint = async (id: number) => {
        window.open(`/finance/vouchers/${id}/print`, "_blank");
    };

    const handleEdit = async (id: number) => {
        router.push(`/finance/vouchers/${id}/edit`);
    };

    const handleApprove = () => {
        setShowApproveDialog(true);
    };

    const handlePost = () => {
        setShowPostDialog(true);
    };

    const handleDelete = () => {
        setShowDeleteDialog(true);
    };

    const handleConfirmApprove = async (notes?: string) => {
        await approveVoucher.mutateAsync({ 
          id: voucher.id,
          data: notes ? { notes } : undefined,
        });
        setShowApproveDialog(false);
    };

    const handleConfirmPost = async (notes?: string) => {
        await postVoucher.mutateAsync({ 
          id: voucher.id,
          data: notes ? { notes } : undefined,
        });
        setShowPostDialog(false);
    };

    const handleConfirmDelete = async () => {
        await deleteVoucher.mutateAsync(voucher.id);
        setShowDeleteDialog(false);
        router.push("/finance/vouchers");
    };

    const handleConfirmUnpost = async () => {
        await unpostVoucher.mutateAsync(voucher.id);
        setShowUnpostDialog(false);
    };

    // Kiểm tra loại phiếu để hiển thị thông tin bổ sung
    const voucherTypeLabels: Record<string, string> = {
        salary: "Chi lương",
        operating_cost: "Chi phí vận hành",
        supplier_payment: "Thanh toán NCC",
        refund: "Hoàn tiền",
        other: "Chi khác",
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            </div>
        );
    }

    if (!voucher) return <div className="p-6">Không tìm thấy dữ liệu...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {voucher.voucherCode}
                        </h1>
                        {/* Badge Duyệt */}
                        {voucher.approvedAt ? (
                            <Badge 
                                color="blue" 
                                variant="light"
                                size="sm"
                                startIcon={<CheckCircle className="h-3 w-3" />}
                                title={`Duyệt bởi: ${voucher.approver?.fullName} lúc ${format(new Date(voucher.approvedAt), 'dd/MM/yyyy HH:mm')}`}
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
                            <Badge 
                                color="gray" 
                                variant="light"
                                size="sm"
                            >
                                Chưa ghi sổ
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-gray-500">Phiếu chi</p>
                    <p className="text-sm text-gray-500">Ngày tạo: {format(new Date(voucher.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/finance/vouchers"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300"
                    >
                        <ArrowLeft className="h-4 w-4" /> Quay lại
                    </Link>
                    
                    {/* In phiếu */}
                    <Button
                        variant="outline"
                        size="ssmm"
                        onClick={() => handlePrint(voucher.id)}
                    >
                        <Printer className="h-4 w-4" /> In phiếu
                    </Button>

                    {/* Chỉnh sửa - chỉ khi chưa ghi sổ */}
                    {!voucher.isPosted && !voucher.approvedAt && (
                        <Can permission="update_payment_voucher">
                            <Button
                                variant="primary"
                                size="ssmm"
                                onClick={() => handleEdit(voucher.id)}
                            >
                                <Edit className="h-4 w-4" /> Chỉnh sửa
                            </Button>
                        </Can>
                    )}

                    {/* Phê duyệt - chỉ khi chưa duyệt */}
                    {!voucher.approvedAt && (
                        <Can permission="approve_payment">
                            <Button
                                variant="success"
                                size="ssmm"
                                onClick={handleApprove}
                                isLoading={approveVoucher.isPending}
                            >
                                <CheckCircle className="h-4 w-4" /> Phê duyệt
                            </Button>
                        </Can>
                    )}

                    {/* Ghi sổ - khi đã duyệt nhưng chưa ghi */}
                    {voucher.approvedAt && !voucher.isPosted && (
                        <Can permission="post_payment_voucher">
                            <Button
                                variant="primary"
                                size="ssmm"
                                onClick={handlePost}
                                isLoading={postVoucher.isPending}
                            >
                                <Lock className="h-4 w-4" /> Ghi sổ
                            </Button>
                        </Can>
                    )}

                    {/* Xóa - chỉ khi chưa ghi sổ */}
                    {!voucher.isPosted && (
                        <Can permission="delete_payment_voucher">
                            <Button
                                variant="danger"
                                size="ssmm"
                                onClick={handleDelete}
                            >
                                <Trash2 className="h-4 w-4" /> Xóa
                            </Button>
                        </Can>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                            <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                                <FileText className="h-5 w-5 text-blue-500" /> Thông tin chi tiết
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                            <InfoItem label="Loại chứng từ" value={voucherTypeLabels[voucher.voucherType] || voucher.voucherType} />
                            <InfoItem label="Tài khoản chi phí" value={voucher.expenseAccount || "---"} />
                            <InfoItem 
                                label="Ngày thanh toán" 
                                value={format(new Date(voucher.paymentDate), 'dd/MM/yyyy')} 
                                icon={<Calendar className="h-4 w-4" />}
                            />
                            <InfoItem 
                                label="Phương thức" 
                                value={`${voucher.paymentMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt'}${voucher.paymentMethod === 'transfer' && voucher.bankName ? ` - ${voucher.bankName}` : ''}`}
                                icon={<CreditCard className="h-4 w-4" />}
                            />
                            
                            {/* Nhà cung cấp - với link */}
                            <div className="sm:col-span-2">
                                {voucher.supplier ? (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase">Nhà cung cấp</p>
                                        <Link 
                                            href={`/suppliers/${voucher.supplier.id}`}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            {voucher.supplier.supplierName} ({voucher.supplier.supplierCode})
                                        </Link>
                                    </div>
                                ) : (
                                    <InfoItem label="Nhà cung cấp" value="---" />
                                )}
                            </div>

                            <div className="sm:col-span-2">
                                <InfoItem label="Nội dung / Ghi chú" value={voucher.notes || "---"} />
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
                                    <p className="text-base font-medium text-gray-900 dark:text-white">Người lập phiếu</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{voucher.creator?.fullName} ({voucher.creator?.employeeCode})</p>
                                    <p className="text-xs text-gray-500">{format(new Date(voucher.createdAt), 'dd/MM/yyyy HH:mm:ss')}</p>
                                </div>

                                {voucher.approvedAt && (
                                    <div className="relative">
                                        <span className="absolute -left-[25px] flex h-4 w-4 items-center justify-center rounded-full bg-green-100 ring-4 ring-white dark:bg-green-900 dark:ring-gray-800">
                                            <div className="h-2 w-2 rounded-full bg-green-600"></div>
                                        </span>
                                        <p className="text-base font-medium text-gray-900 dark:text-white">Người phê duyệt</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{voucher.approver?.fullName} ({voucher.approver?.employeeCode})</p>
                                        <p className="text-xs text-gray-500">{format(new Date(voucher.approvedAt), 'dd/MM/yyyy HH:mm:ss')}</p>
                                    </div>
                                )}

                                {/* Checkbox readonly - Trạng thái ghi sổ */}
                                <div className="relative pt-2">
                                    <span className="absolute -left-[25px] flex h-4 w-4 items-center justify-center rounded-full bg-gray-100 ring-4 ring-white dark:bg-gray-700 dark:ring-gray-800">
                                        <div className="h-2 w-2 rounded-full bg-gray-600"></div>
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="checkbox" 
                                            checked={voucher.isPosted} 
                                            disabled
                                            className="h-4 w-4 rounded border-gray-300 text-green-600 cursor-not-allowed"
                                        />
                                        <label className="text-base font-medium text-gray-900 dark:text-white cursor-not-allowed">
                                            Đã ghi vào sổ cái
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cột phải: Tổng tiền & Ngân hàng */}
                <div className="space-y-6">
                    {/* Card Tổng tiền chi - Màu ĐỎ */}
                    <div className="rounded-xl bg-orange-500 p-6 text-white shadow-lg shadow-red-200 dark:shadow-none">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-red-100">Tổng tiền chi</p>
                            <Banknote className="h-6 w-6 text-red-200" />
                        </div>
                        <p className="mt-2 text-3xl font-bold">
                            {Number(voucher.amount).toLocaleString("vi-VN")} <span className="text-lg">₫</span>
                        </p>
                    </div>

                    {/* Card Ngày hạch toán & Phương thức */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Ngày hạch toán</h3>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <p className="text-base font-semibold text-gray-900 dark:text-white">
                                    {format(new Date(voucher.paymentDate), 'dd/MM/yyyy')}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Phương thức</h3>
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                                <div>
                                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                                        {voucher.paymentMethod === 'transfer' ? 'Chuyển khoản' : 'Tiền mặt'}
                                    </p>
                                    {voucher.paymentMethod === 'transfer' && voucher.bankName && (
                                        <p className="text-xs text-gray-500">{voucher.bankName}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Khu vực tệp đính kèm */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                    <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                        <FileText className="h-5 w-5 text-purple-500" /> Tệp đính kèm
                    </h2>
                </div>
                <div className="p-5">
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p className="text-sm">Chưa có tệp đính kèm</p>
                        <p className="text-xs text-gray-400 mt-1">Hóa đơn, giấy đề nghị thanh toán v.v...</p>
                    </div>
                </div>
            </div>

            {/* Bảng danh sách lương - Nếu loại phiếu là chi lương */}
            {voucher.voucherType === 'salary' && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                        <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                            <FileText className="h-5 w-5 text-green-500" /> Danh sách lương được chi trả
                        </h2>
                    </div>
                    <div className="p-5">
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p className="text-sm">Tính năng này đang được phát triển</p>
                            <p className="text-xs text-gray-400 mt-1">Sẽ hiển thị danh sách nhân viên nhận lương từ phiếu chi này</p>
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    );
}

function InfoItem({ label, value, icon }: { label: string; value: any; icon?: React.ReactNode }) {
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