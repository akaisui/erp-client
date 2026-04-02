'use client';

import { usePurchaseOrder } from "@/hooks";
import { getStatusLabel } from "@/lib/purchaseOrder";
import { formatCurrency, formatDate, formatDateFull } from "@/lib/utils";
import { PurchaseOrder } from "@/types";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useReactToPrint } from 'react-to-print';

export default function PurchaseOrderPrintPage() {
    const params = useParams();
    const purchaseOrderId = parseInt(params.id as string);
    const printRef = useRef<HTMLDivElement>(null);

    const { data: response, isLoading } = usePurchaseOrder(purchaseOrderId);
    const purchaseOrder = response?.data as unknown as PurchaseOrder;

    const handlePrint = useReactToPrint({
        contentRef: printRef,  
        documentTitle: `Don-mua-hang-${purchaseOrder?.poCode || 'print'}`,
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
        if(purchaseOrder && !isLoading) {
            const timer = setTimeout(() => {
                handlePrint();
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [purchaseOrder, isLoading, handlePrint]);


    if(!purchaseOrder) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-600">Không tìm thấy đơn mua hàng</p>
            </div>
        )
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
                  <p className="text-[8px]">Mẫu: 01-VT</p>
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
                Đơn Mua Hàng
              </h2>
              <p className="text-[10px]">
                Số: <span className="font-semibold">{purchaseOrder.poCode}</span>
              </p>
            </div>
    
            {/* Transaction Info - 2 columns compact */}
            <div className="mb-3 text-[9px] leading-tight">
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {purchaseOrder.warehouse && (
                  <div>
                    <span className="font-semibold">Kho:</span>{" "}
                    {purchaseOrder.warehouse.warehouseName}
                  </div>
                )}
                <div>
                  <span className="font-semibold">NCC:</span>{" "}
                  {purchaseOrder.supplier?.supplierName}
                </div>
                <div>
                  <span className="font-semibold">Trạng thái:</span>{" "}
                  {getStatusLabel(purchaseOrder.status)}
                </div>
                <div>
                  <span className="font-semibold">SĐT:</span>{" "}
                  {purchaseOrder.supplier?.phone}
                </div>
                {purchaseOrder.orderDate && (
                  <div>
                    <span className="font-semibold">Ngày mua:</span> {formatDate(purchaseOrder.orderDate)}
                  </div>
                )}
                {purchaseOrder.expectedDeliveryDate && (
                  <div>
                    <span className="font-semibold">Ngày nhận:</span> {formatDate(purchaseOrder.expectedDeliveryDate)}
                  </div>
                )}
              </div>
            </div>
    
            {/* Items Table - Compact for A5 */}
            {purchaseOrder.details && purchaseOrder.details.length > 0 && (
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
                    {purchaseOrder.details.map((detail, index) => {
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
                        {purchaseOrder.details.reduce(
                          (sum, d) => sum + (d.quantity || 0),
                          0
                        )}
                      </td>
                      <td className="border border-gray-800 px-1 py-1"></td>
                      <td className="border border-gray-800 px-1 py-1 text-right">
                        {formatCurrency(purchaseOrder.subTotal || 0)}
                      </td>
                    </tr>

                    {/* Tax Row */}
                    {purchaseOrder.taxRate > 0 && (
                      <>
                        <tr>
                          <td
                            colSpan={5}
                            className="border border-gray-800 px-1 py-1 text-right"
                          >
                            Thuế VAT ({purchaseOrder.taxRate}%):
                          </td>
                          <td className="border border-gray-800 px-1 py-1 text-right">
                            {formatCurrency((purchaseOrder.subTotal || 0) * (purchaseOrder.taxRate / 100))}
                          </td>
                        </tr>
                        <tr className="bg-gray-100 font-bold">
                          <td
                            colSpan={5}
                            className="border border-gray-800 px-1 py-1 text-right"
                          >
                            Tổng sau thuế:
                          </td>
                          <td className="border border-gray-800 px-1 py-1 text-right">
                            {formatCurrency((purchaseOrder.subTotal || 0) * (1 + (purchaseOrder.taxRate / 100)))}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}
    
            {/* Notes - Compact */}
            {purchaseOrder.notes && (
              <div className="mb-3">
                <p className="text-[9px]">
                  <span className="font-semibold">Ghi chú:</span> {purchaseOrder.notes}
                </p>
              </div>
            )}
    
            {/* Signatures - Compact for A5 */}
            <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[8px]">
              <div>
                <p className="mb-8 font-semibold">Người lập</p>
                <p className="italic">{purchaseOrder.creator?.fullName}</p>
              </div>
              <div>
                <p className="mb-8 font-semibold">Thủ kho</p>
                <p className="italic">{purchaseOrder.warehouse?.manager?.fullName}</p>
              </div>
              <div>
                <p className="mb-8 font-semibold">Phê duyệt</p>
                <p className="italic">{purchaseOrder.approver?.fullName}</p>
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