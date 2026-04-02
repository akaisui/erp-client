"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useSalesOrder,
  useApproveSalesOrder,
  useCompleteSalesOrder,
  useCancelSalesOrder,
  useProcessPayment,
  useDeleteSalesOrder,
} from "@/hooks/api";
import Button from "@/components/ui/button/Button";
import PaymentForm from "@/components/sales/PaymentForm";
import OrderTimeline from "@/components/sales/OrderTimeline";
import {
  cancelOrderSchema,
  type CancelOrderInput,
  type ProcessPaymentInput,
} from "@/lib/validations";
import { downloadInvoicePDF, printInvoice } from "@/lib/invoice-html";
import { ApiResponse, SalesOrder } from "@/types";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Trash2,
  Package,
  User,
  MapPin,
  Phone,
  DollarSign,
  Calendar,
  FileText,
  Download,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
  SALES_CHANNEL_LABELS,
} from "@/lib/constants";
import { Can } from "@/components/auth";

/**
 * Sales Order Detail Page
 * Chi tiết đơn hàng với actions: Approve, Complete, Cancel, Add Payment
 */
export default function SalesOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = parseInt(params.id as string);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch data
  const { data, isLoading, error } = useSalesOrder(orderId);
  const response = data as unknown as ApiResponse<SalesOrder>;
  const order = response?.data;

  console.log(order);

  // Mutations
  const approveOrder = useApproveSalesOrder();
  const completeOrder = useCompleteSalesOrder();
  const cancelOrder = useCancelSalesOrder();
  const processPayment = useProcessPayment();
  const deleteOrder = useDeleteSalesOrder();

  // Cancel form
  const {
    register: registerCancel,
    handleSubmit: handleSubmitCancel,
    formState: { errors: errorsCancel },
  } = useForm<CancelOrderInput>({
    resolver: zodResolver(cancelOrderSchema),
  });

  // Handle Approve
  const handleApprove = async () => {
    if (!order) return;

    const confirmed = window.confirm(
      `Duyệt đơn hàng "${order.orderCode}"?\n\nĐơn hàng sẽ được xác nhận và sẵn sàng xử lý.`
    );

    if (!confirmed) return;

    try {
      await approveOrder.mutateAsync({ id: orderId, data: {} });
    } catch (error) {
      console.error("Failed to approve order:", error);
    }
  };

  // Handle Complete
  const handleComplete = async () => {
    if (!order) return;

    const confirmed = window.confirm(
      `Hoàn thành đơn hàng "${order.orderCode}"?\n\nKho sẽ được xuất và công nợ sẽ được ghi nhận.`
    );

    if (!confirmed) return;

    try {
      await completeOrder.mutateAsync(orderId);
    } catch (error) {
      console.error("Failed to complete order:", error);
    }
  };

  // Handle Cancel
  const onCancelSubmit = async (data: CancelOrderInput) => {
    try {
      await cancelOrder.mutateAsync({ id: orderId, data });
      setShowCancelModal(false);
      router.push("/sales/orders");
    } catch (error) {
      console.error("Failed to cancel order:", error);
    }
  };

  // Handle Payment
  const onPaymentSubmit = async (data: ProcessPaymentInput) => {
    try {
      await processPayment.mutateAsync({ id: orderId, data });
      setShowPaymentModal(false);
    } catch (error) {
      console.error("Failed to process payment:", error);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!order) return;

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa đơn hàng "${order.orderCode}"?\n\nHành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    try {
      await deleteOrder.mutateAsync(orderId);
      router.push("/sales/orders");
    } catch (error) {
      console.error("Failed to delete order:", error);
    }
  };

  // Handle Export PDF
  const handleExportPDF = () => {
    if (!order) return;
    try {
      downloadInvoicePDF(order);
    } catch (error) {
      console.error("Failed to export PDF:", error);
    }
  };

  // Handle Print
  const handlePrint = () => {
    if (!order) return;
    try {
      printInvoice(order);
    } catch (error) {
      console.error("Failed to print invoice:", error);
    }
  };

  // Get order status color
  const getOrderStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return colors[status] || colors.pending;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <h3 className="font-semibold text-red-900 dark:text-red-300">
          Lỗi khi tải thông tin đơn hàng
        </h3>
        <p className="mt-1 text-sm text-red-800 dark:text-red-400">
          {(error as any)?.message || "Không tìm thấy đơn hàng"}
        </p>
      </div>
    );
  }

  const remainingAmount = Number(order.totalAmount) - Number(order.paidAmount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <Link href="/sales/orders">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {order.orderCode}
            </h1>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getOrderStatusColor(
                order.orderStatus
              )}`}
            >
              {ORDER_STATUS_LABELS[order.orderStatus]}
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                PAYMENT_STATUS_COLORS[order.paymentStatus]
              }`}
            >
              {PAYMENT_STATUS_LABELS[order.paymentStatus]}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tạo ngày {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {order.orderStatus === "pending" && (
            <>
              <Can permission="approve_sales_order">
                <Button
                  variant="primary"
                  onClick={handleApprove}
                  disabled={approveOrder.isPending}
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Duyệt đơn
                </Button>
              </Can>
              <Can permission="cancel_sales_order">
                <Button variant="danger" onClick={() => setShowCancelModal(true)}>
                  <XCircle className="mr-2 h-5 w-5" />
                  Hủy đơn
                </Button>
              </Can>
            </>
          )}

          {order.orderStatus === "approved" && (
            <Can permission="complete_sales_order">
              <Button
                variant="primary"
                onClick={handleComplete}
                disabled={completeOrder.isPending}
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Hoàn thành
              </Button>
            </Can>
          )}

          {order.orderStatus === "pending" && (
            <Can permission="delete_sales_order">
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleteOrder.isPending}
              >
                <Trash2 className="mr-2 h-5 w-5" />
                Xóa
              </Button>
            </Can>
          )}

          {/* Export & Print Buttons */}
          <div className="border-l border-gray-300 pl-3 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              title="Xuất hóa đơn PDF"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              title="In hóa đơn"
              className="ml-2"
            >
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Thông tin khách hàng
            </h2>

            <div className="flex items-start gap-4">
              {order.customer?.avatarUrl ? (
                <img
                  src={order.customer.avatarUrl}
                  alt={order.customer.customerName}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                  <User className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
              )}

              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {order.customer?.customerName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {order.customer?.customerCode}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4" />
                  {order.customer?.phone}
                </div>

                {order.deliveryAddress && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    {order.deliveryAddress}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Sản phẩm
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="pb-3 text-left text-xs font-semibold text-gray-900 dark:text-white">
                      Sản phẩm
                    </th>
                    <th className="pb-3 text-right text-xs font-semibold text-gray-900 dark:text-white">
                      Đơn giá
                    </th>
                    <th className="pb-3 text-right text-xs font-semibold text-gray-900 dark:text-white">
                      Số lượng
                    </th>
                    <th className="pb-3 text-right text-xs font-semibold text-gray-900 dark:text-white">
                      Giảm giá
                    </th>
                    <th className="pb-3 text-right text-xs font-semibold text-gray-900 dark:text-white">
                      Thuế
                    </th>
                    <th className="pb-3 text-right text-xs font-semibold text-gray-900 dark:text-white">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {order.details?.map((detail) => {
                    const subtotal = Number(detail.unitPrice) * Number(detail.quantity);
                    const discount = (subtotal * Number(detail.discountPercent)) / 100;
                    const taxableAmount = subtotal - discount;
                    const tax = (taxableAmount * Number(detail.taxRate)) / 100;
                    const total = taxableAmount + tax;

                    return (
                      <tr key={detail.id}>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            {detail.product?.imageUrl ? (
                              <img
                                src={detail.product.imageUrl}
                                alt={detail.product.productName}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
                                <Package className="h-5 w-5 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {detail.product?.productName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {detail.product?.sku}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right text-sm text-gray-900 dark:text-white">
                          {formatCurrency(detail.unitPrice)}
                        </td>
                        <td className="py-3 text-right text-sm text-gray-900 dark:text-white">
                          {formatNumber(detail.quantity)} {detail.product?.unit}
                        </td>
                        <td className="py-3 text-right text-sm text-red-600 dark:text-red-400">
                          {detail.discountPercent}%
                        </td>
                        <td className="py-3 text-right text-sm text-gray-900 dark:text-white">
                          {detail.taxRate}%
                        </td>
                        <td className="py-3 text-right font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <OrderTimeline order={order} />
          </div>
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <DollarSign className="h-5 w-5" />
              Tổng đơn hàng
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tổng tiền hàng</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(
                    Number(order.totalAmount) -
                      Number(order.taxAmount) -
                      Number(order.shippingFee) +
                      Number(order.discountAmount)
                  )}
                </span>
              </div>

              {Number(order.discountAmount) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Giảm giá</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    -{formatCurrency(order.discountAmount)}
                  </span>
                </div>
              )}

              {Number(order.taxAmount) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Thuế</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(order.taxAmount)}
                  </span>
                </div>
              )}

              {Number(order.shippingFee) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Phí vận chuyển</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(order.shippingFee)}
                  </span>
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700" />

              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tổng thanh toán
                </span>
                <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Đã thanh toán</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {formatCurrency(order.paidAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">Còn nợ</span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
            </div>

            {/* Add Payment Button */}
            {remainingAmount > 0 && order.orderStatus !== "cancelled" && (
              <Can permission="process_payment">
                <div className="mt-4">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => setShowPaymentModal(true)}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    Thêm thanh toán
                  </Button>
                </div>
              </Can>
            )}
          </div>

          {/* Order Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Thông tin đơn hàng
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Kênh bán hàng</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                  {SALES_CHANNEL_LABELS[order.salesChannel]}
                </p>
              </div>

              <div>
                <p className="text-gray-600 dark:text-gray-400">Phương thức thanh toán</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                </p>
              </div>

              <div>
                <p className="text-gray-600 dark:text-gray-400">Ngày đặt hàng</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                  {format(new Date(order.orderDate), "dd/MM/yyyy")}
                </p>
              </div>

              {order.notes && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Ghi chú</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{order.notes}</p>
                </div>
              )}

              <div>
                <p className="text-gray-600 dark:text-gray-400">Người tạo</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">
                  {order.creator?.fullName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Hủy đơn hàng
            </h3>

            <form onSubmit={handleSubmitCancel(onCancelSubmit)} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lý do hủy <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...registerCancel("reason")}
                  rows={4}
                  placeholder="VD: Khách hàng yêu cầu hủy, hết hàng..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                />
                {errorsCancel.reason && (
                  <p className="mt-1 text-sm text-red-600">{errorsCancel.reason.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                >
                  Đóng
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  disabled={cancelOrder.isPending}
                >
                  {cancelOrder.isPending ? "Đang hủy..." : "Hủy đơn hàng"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <PaymentForm
              orderId={orderId}
              remainingAmount={remainingAmount}
              onSubmit={onPaymentSubmit}
              onCancel={() => setShowPaymentModal(false)}
              isLoading={processPayment.isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
}
