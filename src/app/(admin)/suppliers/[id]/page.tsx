"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useSupplier, useDeleteSupplier, useSupplierProducts, useSupplierPurchaseOrders, useSupplierPaymentVouchers } from "@/hooks/api";
import { Can } from "@/components/auth";
import Badge from "@/components/ui/badge/Badge";
import { MapPin, FileText, Trash2, DollarSign, ArrowLeft, Edit, ShoppingCart, Receipt } from "lucide-react";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import { Supplier, Product, PurchaseOrder, PaymentVoucher } from "@/types";
import { formatCurrency } from "@/lib/utils";
import Button from "@/components/ui/button/Button";

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = parseInt(params.id as string);
  
  const { data: response, isLoading } = useSupplier(supplierId);
  const { data: productsResponse } = useSupplierProducts(supplierId);
  const { data: purchaseOrdersResponse } = useSupplierPurchaseOrders(supplierId, { limit: 10 });
  const { data: paymentVouchersResponse } = useSupplierPaymentVouchers(supplierId, { limit: 10 });
  const deleteSupplier = useDeleteSupplier();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const supplier = response?.data as unknown as Supplier;
  const products = (productsResponse?.data || []) as Product[];
  const purchaseOrders = (purchaseOrdersResponse?.data || []) as PurchaseOrder[];
  const paymentVouchers = (paymentVouchersResponse?.data?.vouchers || []) as PaymentVoucher[];

  const totalPayable = supplier ? ((supplier as any).totalPayable || 0) : 0;
  const totalPaid = paymentVouchers.reduce((sum, voucher) => sum + (voucher.amount || 0), 0);
  const remaining = totalPayable - totalPaid;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-900/30">
        <p className="text-red-700 dark:text-red-300">Không tìm thấy nhà cung cấp</p>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteSupplier.mutateAsync(supplierId);
      router.push("/suppliers");
    } catch (error) {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chi tiết Nhà cung cấp</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Thông tin chi tiết về: {supplier.supplierName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="ssmm" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5"  />
              Quay lại
          </Button>

          <Can permission="create_purchase_order">
            <Button 
              variant="primary" 
              size="ssmm" 
              onClick={() => router.push(`/purchase-orders/create?supplier_id=${supplierId}`)}
              title="Tạo đơn mua mới với NCC này"
            >
                <ShoppingCart className="h-5 w-5"  />
                Tạo đơn mua
            </Button>
          </Can>

          <Can permission="create_payment_voucher">
            <Button 
              variant="success" 
              size="ssmm" 
              onClick={() => router.push(`/payment-vouchers/create?supplier_id=${supplierId}`)}
              title="Tạo phiếu chi để trả nợ"
            >
                <Receipt className="h-5 w-5"  />
                Thanh toán nợ
            </Button>
          </Can>

          <Can permission="update_supplier">
            <Button 
              variant="primary" 
              size="ssmm" 
              onClick={() => router.push(`/suppliers/${supplierId}/edit`)}
            >
                <Edit className="h-5 w-5"  />
                Sửa thông tin
            </Button>
          </Can>

          <Can permission="delete_supplier">
            <Button variant="danger" size="ssmm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-5 w-5" />
                Xóa
            </Button>
          </Can>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Loại NCC
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                {supplier.supplierType === "local" ? "Trong nước" : "Nước ngoài"}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Trạng thái
              </p>
              <div className="mt-2">
                <Badge color={supplier.status === "active" ? "green" : "gray"}>
                  {supplier.status === "active" ? "Hoạt động" : "Không hoạt động"}
                </Badge>
              </div>
            </div>
            <div className={`rounded-full p-3 ${supplier.status === "active" ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-700"}`}>
              <svg className={`h-8 w-8 ${supplier.status === "active" ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Nợ phải trả
              </p>
              <p className="mt-2 text-lg font-bold text-red-600 dark:text-red-400">
                {formatCurrency((supplier as any).totalPayable || 0)}
              </p>
            </div>
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
              <DollarSign className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Information Sections */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
              Thông tin cơ bản
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Mã NCC
                </label>
                <p className="mt-2 text-gray-900 dark:text-white">{supplier.supplierCode}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tên nhà cung cấp
                </label>
                <p className="mt-2 text-gray-900 dark:text-white">{supplier.supplierName}</p>
              </div>
              {supplier.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Email
                  </label>
                  <p className="mt-2 text-gray-900 dark:text-white">{supplier.email}</p>
                </div>
              )}
              {supplier.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Số điện thoại
                  </label>
                  <p className="mt-2 text-gray-900 dark:text-white">{supplier.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Address & Contact */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
              Địa chỉ & Liên hệ
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {supplier.address && (
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    Địa chỉ
                  </label>
                  <p className="mt-2 text-gray-900 dark:text-white">{supplier.address}</p>
                </div>
              )}
              {supplier.contactName && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Người liên hệ
                  </label>
                  <p className="mt-2 text-gray-900 dark:text-white">{supplier.contactName}</p>
                </div>
              )}
              {supplier.taxCode && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <FileText className="h-4 w-4" />
                    Mã số thuế
                  </label>
                  <p className="mt-2 text-gray-900 dark:text-white">{supplier.taxCode}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment & Notes */}
          {(supplier.paymentTerms || supplier.notes) && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
                Thêm thông tin
              </h2>
              <div className="space-y-6">
                {supplier.paymentTerms && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      Điều khoản thanh toán
                    </label>
                    <p className="mt-2 text-gray-900 dark:text-white">{supplier.paymentTerms}</p>
                  </div>
                )}
                {supplier.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                      Ghi chú
                    </label>
                    <p className="mt-2 text-gray-900 dark:text-white">{supplier.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - 1/3 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
            Thông tin hệ thống
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                Loại NCC
              </label>
              <div className="mt-2">
                <Badge color={supplier.supplierType === "local" ? "blue" : "purple"}>
                  {supplier.supplierType === "local" ? "Trong nước" : "Nước ngoài"}
                </Badge>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                Trạng thái
              </label>
              <div className="mt-2">
                <Badge color={supplier.status === "active" ? "green" : "gray"}>
                  {supplier.status === "active" ? "Hoạt động" : "Không hoạt động"}
                </Badge>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                Ngày tạo
              </label>
              <p className="mt-2 text-gray-900 dark:text-white">
                {new Date(supplier.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                Cập nhật lần cuối
              </label>
              <p className="mt-2 text-gray-900 dark:text-white">
                {new Date(supplier.updatedAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sản phẩm cung cấp */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Sản phẩm cung cấp
        </h2>
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {products && products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        #
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Mã sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Tên sản phẩm
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Giá mua
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr
                      key={product.id}
                      className="border-t border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                    >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {index + 1}
                        </td>
                      <td className="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                        <Link href={`/products/${product.id}`} className="hover:underline">
                          {product.sku}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {product.productName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {formatCurrency(product.purchasePrice || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge
                          color={
                            product.status === "active"
                              ? "green"
                              : product.status === "inactive"
                                ? "gray"
                                : "red"
                          }
                        >
                          {product.status === "active"
                            ? "Hoạt động"
                            : product.status === "inactive"
                              ? "Không hoạt động"
                              : "Ngừng sản xuất"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-gray-500 dark:text-gray-400">
              <p>Chưa có dữ liệu sản phẩm cung cấp</p>
            </div>
          )}
        </div>
      </div>

      {/* Lịch sử Đơn mua */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Lịch sử đơn mua
        </h2>
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {purchaseOrders && purchaseOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        #
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Mã đơn mua
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Ngày đặt
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Tổng tiền
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((order, index) => (
                    <tr
                      key={order.id}
                      className="border-t border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                        <Link href={`/purchase-orders/${order.id}`} className="hover:underline">
                          PO-{String(order.id).padStart(6, "0")}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {new Date(order.orderDate).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(order.totalAmount || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge
                          color={
                            order.status === "pending"
                              ? "yellow"
                              : order.status === "approved"
                                ? "blue"
                                : order.status === "received"
                                  ? "green"
                                  : "gray"
                          }
                        >
                          {order.status === "pending"
                            ? "Chờ xác nhận"
                            : order.status === "approved"
                              ? "Đã xác nhận"
                              : order.status === "received"
                                ? "Đã nhận hàng"
                                : "Đã hủy"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-gray-500 dark:text-gray-400">
              <p>Chưa có lịch sử đơn mua</p>
            </div>
          )}
        </div>
      </div>

      {/* Công nợ & Thanh toán */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Công nợ & Thanh toán
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Tổng nợ phải trả
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency((supplier as any).totalPayable || 0)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Đã thanh toán
            </p>
            <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalPaid)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Còn lại
            </p>
            <p className={`mt-2 text-2xl font-bold ${remaining > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <h3 className="border-b border-gray-200 px-6 py-4 text-lg font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
            Lịch sử thanh toán
          </h3>
          {paymentVouchers && paymentVouchers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Mã phiếu chi
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Ngày thanh toán
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Số tiền
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Hình thức
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Người duyệt
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Ghi chú
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paymentVouchers.map((voucher) => (
                    <tr
                      key={voucher.id}
                      className="border-t border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                        {voucher.voucherCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {new Date(voucher.paymentDate).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(voucher.amount || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <Badge color={voucher.paymentMethod === "cash" ? "yellow" : "blue"}>
                          {voucher.paymentMethod === "cash" ? "Tiền mặt" : "Chuyển khoản"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {voucher.approver?.fullName || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {voucher.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-gray-500 dark:text-gray-400">
              <p>Chưa có lịch sử thanh toán</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Xóa nhà cung cấp"
        message={`Bạn có chắc chắn muốn xóa nhà cung cấp "${supplier.supplierName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
      />
    </div>
  );
}
