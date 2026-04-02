import React, { forwardRef } from "react";
import Image from "next/image";
import { PaymentVoucher } from "@/types";
import { formatCurrency, formatDate, formatDateFull } from "@/lib/utils";

interface PaymentVoucherTemplateProps {
  voucher: PaymentVoucher | null;
}

const voucherTypeLabels: Record<string, string> = {
  salary: "Trả lương",
  supplier_payment: "Thanh toán NCC",
  operating_cost: "Chi phí vận hành",
  refund: "Hoàn tiền",
  other: "Khác",
};

const paymentMethodLabels: Record<string, string> = {
  cash: "Tiền mặt",
  transfer: "Chuyển khoản",
};

export const PaymentVoucherTemplate = forwardRef<HTMLDivElement, PaymentVoucherTemplateProps>(
  ({ voucher }, ref) => {
    if (!voucher) return null;

    const getRecipientName = (): string => {
        if (voucher.supplier?.supplierName) return voucher.supplier.supplierName;
        if (voucher.voucherType === "salary") return "Bảng lương tháng";
        return voucher.notes || "—";
    };

    return (
      <div ref={ref} className="mx-auto bg-white p-4" style={{ maxWidth: '148mm' }}>
        {/* Header - Compact for A5 */}
        <div className="mb-4 border-b-2 border-gray-800 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="mb-1 text-[10px] font-semibold uppercase leading-tight">
                Công Ty Cổ Phần Hoá Sinh Nam Việt
              </h1>
              <p className="text-[8px] leading-tight">QL30/ấp Đông Mỹ, Mỹ Hội, Cao Lãnh, ĐT</p>
              <p className="text-[8px] leading-tight">ĐT: 0886 357 788</p>
            </div>
            <div className="text-right">
              <p className="text-[8px]">Mẫu: 01-CT</p>
              <p className="text-[8px]">
                {formatDateFull(new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>

        {/* Title with Logo - Compact */}
        <div className="mb-3 text-center">
          <Image 
            src="/images/logo/logo-nobackground.png"
            alt="Logo"
            width={60}
            height={60}
            className="mx-auto mb-1"
          />
          <h2 className="mb-1 text-sm font-bold uppercase">
            Phiếu Chi
          </h2>
          <p className="text-[10px]">
            Số: <span className="font-semibold">{voucher.voucherCode}</span>
          </p>
        </div>

        {/* Transaction Info - 2 columns compact */}
        <div className="mb-3 text-[9px] leading-tight">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div>
              <span className="font-semibold">Loại chi:</span>{" "}
              {voucherTypeLabels[voucher.voucherType] || voucher.voucherType}
            </div>
            <div>
              <span className="font-semibold">Hình thức:</span>{" "}
              {paymentMethodLabels[voucher.paymentMethod] || voucher.paymentMethod}
            </div>
            <div>
              <span className="font-semibold">Đối tượng:</span>{" "}
              {getRecipientName()}
            </div>
            {voucher.bankName && (
              <div>
                <span className="font-semibold">Ngân hàng:</span>{" "}
                {voucher.bankName}
              </div>
            )}
            <div>
              <span className="font-semibold">Ngày chi:</span>{" "}
              {formatDate(voucher.paymentDate)}
            </div>
            <div>
              <span className="font-semibold">TK chi phí:</span>{" "}
              {voucher.expenseAccount || "—"}
            </div>
          </div>
        </div>

        {/* Amount Section */}
        <div className="mb-3 rounded-lg border border-gray-800 p-3 text-center">
          <p className="text-[9px] font-semibold text-gray-700">Số tiền chi</p>
          <p className="text-lg font-bold text-red-600">
            {formatCurrency(voucher.amount || 0)}
          </p>
        </div>

        {/* Notes - Compact */}
        {voucher.notes && (
          <div className="mb-3">
            <p className="text-[9px]">
              <span className="font-semibold">Ghi chú:</span> {voucher.notes}
            </p>
          </div>
        )}

        {/* Status Section */}
        <div className="mb-3 text-[9px]">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold">Trạng thái:</span>
              <p className="mt-1 inline-block rounded bg-gray-200 px-2 py-1 text-[8px]">
                {voucher.isPosted ? "✓ Đã ghi sổ" : voucher.approvedBy ? "✓ Đã duyệt" : "⊘ Chờ duyệt"}
              </p>
            </div>
            {voucher.approvedAt && (
              <div>
                <span className="font-semibold">Duyệt lúc:</span>
                <p className="text-[8px]">{formatDate(voucher.approvedAt)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Signatures - Compact for A5 */}
        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[8px]">
          <div>
            <p className="mb-8 font-semibold">Người lập</p>
            <p className="italic">{voucher.creator?.fullName}</p>
          </div>
          <div>
            <p className="mb-8 font-semibold">Kế toán</p>
            <p className="italic">{voucher.approver?.fullName || "—"}</p>
          </div>
          <div>
            <p className="mb-8 font-semibold">Quản lý</p>
            <p className="italic">—</p>
          </div>
        </div>

        {/* Footer - Compact */}
        <div className="mt-4 border-t pt-2 text-center text-[7px] text-gray-600">
          <p>In tự động từ hệ thống - {formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    );
  }
);

PaymentVoucherTemplate.displayName = "PaymentVoucherTemplate";
