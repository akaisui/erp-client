'use client';

import { usePurchaseOrder } from "@/hooks";
import { formatCurrency, formatDate, formatDateFull } from "@/lib/utils";
import { PurchaseOrder } from "@/types";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";

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
                size: A4;
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

    const getStatusLabel = (status: string) => {
        const map: Record<string, string> = {
        pending: "Chờ duyệt",
        approved: "Đã duyệt",
        received: "Đã nhận hàng",
        cancelled: "Đã hủy",
        };
        return map[status] || status;
    };

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
          <div className="print:hidden fixed top-4 right-4 z-10">
            <button
              onClick={() => window.print()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              🖨️ In phiếu
            </button>
            <button
              onClick={() => window.close()}
              className="ml-2 rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
            >
              ✕ Đóng
            </button>
          </div>
    
          {/* Print Content */}
          <div ref={printRef} className="mx-auto max-w-4xl bg-white p-8 print:p-0">
            {/* Header */}
            <div className="mb-8 border-b-2 border-gray-800 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="mb-1 text-sm font-semibold uppercase">
                    Công Ty Cổ Phần Hoá Sinh Nam Việt
                  </h1>
                  <p className="text-xs">Địa chỉ: QL30/ấp Đông Mỹ, Mỹ Hội, Cao Lãnh, Đồng Tháp 81167</p>
                  <p className="text-xs">Điện thoại: 0886 357 788</p>
                  <p className="text-xs">Email: hoasinhnamviet@gmail.com</p>
                </div>
                <div className="text-right">
                  <p className="text-xs">Mẫu số: 01-VT</p>
                  <p className="text-xs">
                    Ngày in: {formatDateFull(new Date().toISOString())}
                  </p>
                </div>
              </div>
            </div>
    
            {/* Title */}
            <div className="mb-6 text-center">
              <Image 
                src="/images/logo/logo-nobackground.png"
                alt="Logo"
                width={120}
                height={120}
                className="mx-auto mb-2"
              />
              <h2 className="mb-2 text-xl font-bold uppercase">
                Đơn Mua Hàng
              </h2>
              <p className="text-sm">
                Số: <span className="font-semibold">{purchaseOrder.poCode}</span>
              </p>
            </div>
    
            {/* Transaction Info */}
            <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
              {purchaseOrder.warehouse && (
                <div>
                  <span className="font-semibold">Kho:</span>{" "}
                  {purchaseOrder.warehouse.warehouseName}
                </div>
              )}
              <div>
                <span className="font-semibold">Khách hàng:</span>{" "}
                {purchaseOrder.supplier?.supplierName}
              </div>
              <div>
                <span className="font-semibold">Trạng thái:</span>{" "}
                {getStatusLabel(purchaseOrder.status)}
              </div>
              <div>
                <span className="font-semibold">Email:</span>{" "}
                {purchaseOrder.supplier?.email}
              </div>
              {purchaseOrder.orderDate && (
                <div>
                  <span className="font-semibold">Ngày mua hàng:</span> {formatDate(purchaseOrder.orderDate)}
                </div>
              )}
              <div>
                <span className="font-semibold">SĐT:</span>{" "}
                {purchaseOrder.supplier?.phone}
              </div>
              {purchaseOrder.expectedDeliveryDate && (
                <div>
                  <span className="font-semibold">Ngày nhận hàng dự kiến:</span> {formatDate(purchaseOrder.expectedDeliveryDate)}
                </div>
              )}
              <div>
                <span className="font-semibold">Địa chỉ:</span>{" "}
                {purchaseOrder.supplier?.address}
              </div>
            </div>
    
            {/* Items Table */}
            {purchaseOrder.details && purchaseOrder.details.length > 0 && (
              <div className="mb-6">
                <table className="w-full border-collapse border border-gray-800 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-800 px-2 py-2 text-center">
                        STT
                      </th>
                      <th className="border border-gray-800 px-2 py-2 text-left">
                        Tên sản phẩm
                      </th>
                      <th className="border border-gray-800 px-2 py-2 text-center">
                        Mã SP
                      </th>
                      <th className="border border-gray-800 px-2 py-2 text-center">
                        Đơn vị
                      </th>
                      <th className="border border-gray-800 px-2 py-2 text-right">
                        Số lượng
                      </th>
                      <th className="border border-gray-800 px-2 py-2 text-right">
                        Đơn giá
                      </th>
                      <th className="border border-gray-800 px-2 py-2 text-right">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrder.details.map((detail, index) => {
                      const itemTotal = (detail.quantity || 0) * (detail.unitPrice || 0);
                      return (
                        <tr key={index}>
                          <td className="border border-gray-800 px-2 py-2 text-center">
                            {index + 1}
                          </td>
                          <td className="border border-gray-800 px-2 py-2">
                            {detail.product?.productName || "—"}
                          </td>
                          <td className="border border-gray-800 px-2 py-2 text-center">
                            {detail.product?.sku || "—"}
                          </td>
                          <td className="border border-gray-800 px-2 py-2 text-center">
                            {detail.product?.unit || "cái"}
                          </td>
                          <td className="border border-gray-800 px-2 py-2 text-right">
                            {detail.quantity || 0}
                          </td>
                          <td className="border border-gray-800 px-2 py-2 text-right">
                            {formatCurrency(detail.unitPrice || 0)}
                          </td>
                          <td className="border border-gray-800 px-2 py-2 text-right font-semibold">
                            {formatCurrency(itemTotal)}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Total Row */}
                    <tr className="bg-gray-50 font-bold">
                      <td
                        colSpan={4}
                        className="border border-gray-800 px-2 py-2 text-right"
                      >
                        Tổng cộng:
                      </td>
                      <td className="border border-gray-800 px-2 py-2 text-right">
                        {purchaseOrder.details.reduce(
                          (sum, d) => sum + (d.quantity || 0),
                          0
                        )}
                      </td>
                      <td className="border border-gray-800 px-2 py-2"></td>
                      <td className="border border-gray-800 px-2 py-2 text-right">
                        {formatCurrency(purchaseOrder.totalAmount || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
    
            {/* Notes */}
            {purchaseOrder.notes && (
              <div className="mb-6">
                <p className="text-sm">
                  <span className="font-semibold">Ghi chú:</span> {purchaseOrder.notes}
                </p>
              </div>
            )}
    
            {/* Signatures */}
            <div className="mt-12 grid grid-cols-3 gap-8 text-center text-sm">
              <div>
                <p className="mb-16 font-semibold">Người lập phiếu</p>
                <p className="italic">{purchaseOrder.creator?.fullName}</p>
              </div>
              <div>
                <p className="mb-16 font-semibold">Thủ kho</p>
                <p className="italic">{purchaseOrder.warehouse?.manager?.fullName}</p>
              </div>
              <div>
                <p className="mb-16 font-semibold">Người phê duyệt</p>
                <p className="italic">{purchaseOrder.approver?.fullName}</p>
              </div>
            </div>
    
            {/* Footer */}
            <div className="mt-8 border-t pt-4 text-center text-xs text-gray-600">
              <p>Phiếu được in tự động từ hệ thống quản lý kho</p>
              <p>{formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </>
      );
}