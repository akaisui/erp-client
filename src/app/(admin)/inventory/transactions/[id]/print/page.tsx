"use client";

import React, { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useStockTransaction } from "@/hooks/api";
import { formatCurrency, formatDate, formatDateFull } from "@/lib/utils";
import { StockTransaction } from "@/types";
import Image from "next/image";
import { useReactToPrint } from "react-to-print";

export default function TransactionPrintPage() {
  const params = useParams();
  const transactionId = parseInt(params.id as string);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: response, isLoading } = useStockTransaction(transactionId);
  const transaction = response?.data as unknown as StockTransaction;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Phieu-xuat-kho-${transaction?.transactionCode || 'print'}`,
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

  useEffect(() => {
    if (transaction && !isLoading) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [transaction, isLoading, handlePrint]);

  const getTransactionTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      import: "Nhập Kho",
      export: "Xuất Kho",
      transfer: "Chuyển Kho",
      disposal: "Xuất Hủy",
      stocktake: "Kiểm Kê",
    };
    return map[type] || "Phiếu Kho";
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      draft: "Nháp",
      pending: "Chờ duyệt",
      approved: "Đã duyệt",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return map[status] || status;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Không tìm thấy phiếu kho</p>
      </div>
    );
  }

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
              <p className="text-[8px]">Mẫu: 02-VT</p>
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
            Phiếu {getTransactionTypeLabel(transaction.transactionType)}
          </h2>
          <p className="text-[10px]">
            Số: <span className="font-semibold">{transaction.transactionCode}</span>
          </p>
        </div>

        {/* Transaction Info - 2 columns compact */}
        <div className="mb-3 text-[9px] leading-tight">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {transaction.warehouse && (
              <div>
                <span className="font-semibold">Kho:</span>{" "}
                {transaction.warehouse.warehouseName}
              </div>
            )}
            <div>
              <span className="font-semibold">Trạng thái:</span>{" "}
              <span className="font-semibold capitalize">{getStatusLabel(transaction.status)}</span>
            </div>
            {transaction.sourceWarehouse && (
              <div>
                <span className="font-semibold">Kho nguồn:</span>{" "}
                {transaction.sourceWarehouse.warehouseName}
              </div>
            )}
            {transaction.destinationWarehouse && (
              <div>
                <span className="font-semibold">Kho đích:</span>{" "}
                {transaction.destinationWarehouse.warehouseName}
              </div>
            )}
            {transaction.reason && (
              <div className="col-span-2">
                <span className="font-semibold">Lý do:</span> {transaction.reason}
              </div>
            )}
            {transaction.createdAt && (
              <div>
                <span className="font-semibold">Ngày tạo:</span> {formatDate(transaction.createdAt)}
              </div>
            )}
            {transaction.approvedAt && (
              <div>
                <span className="font-semibold">Ngày duyệt:</span> {formatDate(transaction.approvedAt)}
              </div>
            )}
          </div>
        </div>

        {/* Items Table - Compact for A5 */}
        {transaction.details && transaction.details.length > 0 && (
          <div className="mb-3">
            <table className="w-full border-collapse border border-gray-800 text-[8px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-800 px-1 py-1 text-center">
                    STT
                  </th>
                  <th className="border border-gray-800 px-1 py-1 text-left">
                    Tên SP
                  </th>
                  <th className="border border-gray-800 px-1 py-1 text-center">
                    ĐVT
                  </th>
                  <th className="border border-gray-800 px-1 py-1 text-right">
                    SL
                  </th>
                  <th className="border border-gray-800 px-1 py-1 text-right">
                    Đơn giá
                  </th>
                  <th className="border border-gray-800 px-1 py-1 text-right">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody>
                {transaction.details.map((detail, index) => {
                  const itemTotal = (detail.quantity || 0) * (detail.unitPrice || 0);
                  return (
                    <tr key={index}>
                      <td className="border border-gray-800 px-1 py-1 text-center">
                        {index + 1}
                      </td>
                      <td className="border border-gray-800 px-1 py-1">
                        {detail.product?.productName || "—"}
                      </td>
                      <td className="border border-gray-800 px-1 py-1 text-center">
                        {detail.product?.unit || "cái"}
                      </td>
                      <td className="border border-gray-800 px-1 py-1 text-right">
                        {detail.quantity || 0}
                      </td>
                      <td className="border border-gray-800 px-1 py-1 text-right">
                        {formatCurrency(detail.unitPrice || 0)}
                      </td>
                      <td className="border border-gray-800 px-1 py-1 text-right font-semibold">
                        {formatCurrency(itemTotal)}
                      </td>
                    </tr>
                  );
                })}
                {/* Total Row */}
                <tr className="bg-gray-50 font-bold">
                  <td
                    colSpan={3}
                    className="border border-gray-800 px-1 py-1 text-right"
                  >
                    Tổng:
                  </td>
                  <td className="border border-gray-800 px-1 py-1 text-right">
                    {transaction.details.reduce(
                      (sum, d) => sum + (Number(d.quantity) || 0),
                      0
                    )}
                  </td>
                  <td className="border border-gray-800 px-1 py-1"></td>
                  <td className="border border-gray-800 px-1 py-1 text-right">
                    {Number(transaction.totalValue) !== 0 ? formatCurrency(transaction.totalValue || 0) : 
                      formatCurrency(transaction.details.reduce(
                        (sum, d) => sum + (Number(d.quantity) || 0) * (Number(d.unitPrice) || 0),
                        0
                      ))
                    }
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Notes - Compact */}
        {transaction.notes && (
          <div className="mb-3">
            <p className="text-[9px]">
              <span className="font-semibold">Ghi chú:</span> {transaction.notes}
            </p>
          </div>
        )}

        {/* Signatures - Compact for A5 */}
        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[8px]">
          <div>
            <p className="mb-8 font-semibold">Người lập</p>
            <p className="italic">{transaction.creator?.fullName}</p>
          </div>
          <div>
            <p className="mb-8 font-semibold">Thủ kho</p>
            <p className="italic">{transaction.warehouse?.manager?.fullName}</p>
          </div>
          <div>
            <p className="mb-8 font-semibold">Phê duyệt</p>
            <p className="italic">{transaction.approver?.fullName}</p>
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
