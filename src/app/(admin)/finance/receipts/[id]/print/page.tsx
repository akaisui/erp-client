'use client';

import { usePaymentReceipt } from "@/hooks";
import { formatCurrency, formatDate, formatDateFull } from "@/lib/utils";
import { ApiResponse, PaymentReceipt } from "@/types";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useReactToPrint } from 'react-to-print';

const receiptTypeLabels: Record<string, string> = {
  sales: "Phiếu thu bán hàng",
  debt_collection: "Thu công nợ",
  refund: "Hoàn tiền",
  other: "Khác",
};

const paymentMethodLabels: Record<string, string> = {
  cash: "Tiền mặt",
  transfer: "Chuyển khoản",
  card: "Thẻ",
};

export default function PaymentReceiptPrintPage() {
    const params = useParams();
    const receiptId = parseInt(params.id as string);
    const printRef = useRef<HTMLDivElement>(null);

    const { data: response, isLoading } = usePaymentReceipt(receiptId);
    const dataWrapper = response as unknown as ApiResponse<PaymentReceipt>;
    const receipt = dataWrapper?.data;

    const handlePrint = useReactToPrint({
        contentRef: printRef,  
        documentTitle: `Phieu-thu-${receipt?.receiptCode || 'print'}`,
        pageStyle: `
            @page {
                size: A5;
                margin: 10mm;
            }
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
            }
        `,
    });

    // Auto print when data loads (optional)
    useEffect(() => {
        if(receipt && !isLoading) {
            const timer = setTimeout(() => {
                handlePrint();
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [receipt, isLoading, handlePrint]);

    if(!receipt) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-600">Không tìm thấy phiếu thu</p>
            </div>
        )
    }

    const getCustomerInfo = (): string => {
        if (receipt.customerRef?.customerName) return receipt.customerRef.customerName;
        return receipt.notes || "—";
    };

    return (
        <>
          {/* Print Button - Hidden when printing */}
          <div className="print:hidden fixed top-4 right-4 z-10 flex gap-2">
            <button
              onClick={handlePrint}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              🖨️ In phiếu A5
            </button>
            <button
              onClick={() => window.close()}
              className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
            >
              ✕ Đóng
            </button>
          </div>
    
          {/* Print Content - Optimized for A5 (148mm x 210mm) */}
          <div ref={printRef} className="mx-auto bg-white p-4" style={{ maxWidth: '148mm' }}>
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
                  <p className="text-[8px]">Mẫu: 02-CT</p>
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
                Phiếu Thu
              </h2>
              <p className="text-[10px]">
                Số: <span className="font-semibold">{receipt.receiptCode}</span>
              </p>
            </div>
    
            {/* Transaction Info - 2 columns compact */}
            <div className="mb-3 text-[9px] leading-tight">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <div>
                  <span className="font-semibold">Loại thu:</span>{" "}
                  {receiptTypeLabels[receipt.receiptType] || receipt.receiptType}
                </div>
                <div>
                  <span className="font-semibold">Hình thức:</span>{" "}
                  {paymentMethodLabels[receipt.paymentMethod] || receipt.paymentMethod}
                </div>
                <div>
                  <span className="font-semibold">Đối tượng:</span>{" "}
                  {getCustomerInfo()}
                </div>
                {receipt.bankName && (
                  <div>
                    <span className="font-semibold">Ngân hàng:</span>{" "}
                    {receipt.bankName}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Ngày thu:</span>{" "}
                  {formatDate(receipt.receiptDate)}
                </div>
                {receipt.transactionReference && (
                  <div>
                    <span className="font-semibold">Mã giao dịch:</span>{" "}
                    {receipt.transactionReference}
                  </div>
                )}
              </div>
            </div>

            {/* Order Reference */}
            {receipt.order && (
              <div className="mb-3 border-l-4 border-blue-500 bg-blue-50 p-2 text-[9px]">
                <p className="mb-1">
                  <span className="font-semibold">Đơn hàng:</span> {receipt.order.orderCode}
                </p>
                <p className="mb-1">
                  <span className="font-semibold">Tổng giá:</span> {formatCurrency(receipt.order.totalAmount || 0)}
                </p>
                <p>
                  <span className="font-semibold">Trạng thái:</span> {receipt.order.orderStatus}
                </p>
              </div>
            )}
    
            {/* Amount Section */}
            <div className="mb-3 rounded-lg border border-gray-800 p-3 text-center">
              <p className="text-[9px] font-semibold text-gray-700">Số tiền thu</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(receipt.amount || 0)}
              </p>
            </div>
    
            {/* Notes - Compact */}
            {receipt.notes && (
              <div className="mb-3">
                <p className="text-[9px]">
                  <span className="font-semibold">Ghi chú:</span> {receipt.notes}
                </p>
              </div>
            )}
    
            {/* Status Section */}
            <div className="mb-3 text-[9px]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold">Trạng thái:</span>
                  <p className="mt-1 inline-block rounded bg-gray-200 px-2 py-1 text-[8px]">
                    {receipt.isPosted ? "✓ Đã ghi sổ" : receipt.approvedBy ? "✓ Đã duyệt" : "⊘ Chờ duyệt"}
                  </p>
                </div>
                {receipt.approvedAt && (
                  <div>
                    <span className="font-semibold">Duyệt lúc:</span>
                    <p className="text-[8px]">{formatDate(receipt.approvedAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Status */}
            {receipt.isVerified && (
              <div className="mb-3 rounded bg-green-100 p-2 text-center">
                <p className="text-[9px] font-semibold text-green-700">✓ Đã xác thực</p>
              </div>
            )}
    
            {/* Signatures - Compact for A5 */}
            <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[8px]">
              <div>
                <p className="mb-8 font-semibold">Người lập</p>
                <p className="italic">{receipt.creator?.fullName}</p>
              </div>
              <div>
                <p className="mb-8 font-semibold">Kế toán</p>
                <p className="italic">{receipt.approver?.fullName || "—"}</p>
              </div>
              <div>
                <p className="mb-8 font-semibold">Khách hàng</p>
                <p className="italic">—</p>
              </div>
            </div>
    
            {/* Footer - Compact */}
            <div className="mt-4 border-t pt-2 text-center text-[7px] text-gray-600">
              <p>In tự động từ hệ thống - {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </>
    );
}
