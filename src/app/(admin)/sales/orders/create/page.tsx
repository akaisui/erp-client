"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateSalesOrder } from "@/hooks/api";
import { useOrderCart } from "@/hooks/useOrderCart";
import CustomerSelector from "@/components/sales/CustomerSelector";
import WarehouseSelector from "@/components/sales/WarehouseSelector";
import ProductCart from "@/components/sales/ProductCart";
import OrderSummary from "@/components/sales/OrderSummary";
import Button from "@/components/ui/button/Button";
import AlertDialog from "@/components/ui/modal/AlertDialog";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import type { Customer, PaymentMethod, SalesChannel, CreateSalesOrderDto } from "@/types";
import { SALES_CHANNEL_LABELS } from "@/lib/constants";

interface Alert {
  isOpen: boolean;
  title?: string;
  message: string;
  variant: "success" | "danger" | "warning" | "info";
}

export default function CreateSalesOrderPage() {
  const router = useRouter();
  const createOrder = useCreateSalesOrder();

  // State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [salesChannel, setSalesChannel] = useState<SalesChannel>("retail");
  const [isPickupOrder, setIsPickupOrder] = useState(false); // true = lấy ngay, false = giao hàng
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [shippingFee, setShippingFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [alert, setAlert] = useState<Alert>({ isOpen: false, message: "", variant: "info" });

  // Cart hook
  const cart = useOrderCart({ shippingFee });

  // Validation
  const canSubmit = selectedCustomer && cart.items.length > 0;

  // Check credit limit
  const debtAmount = cart.summary.total - paidAmount;
  const availableCredit = selectedCustomer
    ? Math.max(0, selectedCustomer.creditLimit - selectedCustomer.currentDebt)
    : 0;
  const willExceedLimit =
    paymentMethod === "credit" && selectedCustomer && debtAmount > availableCredit;

  // Handle Submit
  const handleSubmit = async () => {
    if (!canSubmit || !selectedCustomer) return;

    // Validate delivery info
    if (!isPickupOrder && !deliveryAddress.trim()) {
      setAlert({
        isOpen: true,
        title: "Thiếu thông tin",
        message: "Vui lòng nhập địa chỉ giao hàng.",
        variant: "warning",
      });
      return;
    }

    // Validate credit limit
    if (willExceedLimit) {
      setAlert({
        isOpen: true,
        title: "Vượt hạn mức công nợ",
        message: "Đơn hàng vượt hạn mức công nợ của khách hàng. Vui lòng tăng số tiền trả trước hoặc thay đổi phương thức thanh toán.",
        variant: "warning",
      });
      return;
    }

    const data: CreateSalesOrderDto = {
      customerId: selectedCustomer.id,
      warehouseId: selectedWarehouseId || undefined,
      salesChannel,
      isPickupOrder, // Gửi thông tin lấy ngay vs giao hàng
      deliveryAddress: !isPickupOrder ? deliveryAddress : undefined,
      recipientName: !isPickupOrder ? recipientName : undefined,
      recipientPhone: !isPickupOrder ? recipientPhone : undefined,
      shippingFee: !isPickupOrder ? shippingFee : 0,
      paymentMethod,
      orderDate: new Date().toISOString().split('T')[0],
      paidAmount: paymentMethod === "credit" || paymentMethod === "installment" ? paidAmount : cart.summary.total,
      notes: notes || undefined,
      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: parseFloat(String(item.quantity)) || 0,
        unitPrice: parseFloat(String(item.unitPrice)) || 0,
        discountPercent: parseFloat(String(item.discountPercent)) || 0,
        taxRate: parseFloat(String(item.taxRate)) || 0,
      })),
    };

    try {
      const response = await createOrder.mutateAsync(data);
      setAlert({
        isOpen: true,
        title: "Thành công",
        message: "Đơn hàng đã được tạo thành công!",
        variant: "success",
      });
      setTimeout(() => {
        cart.clearCart();
        router.push(`/sales/orders/${response.data.id}`);
      }, 1000);
    } catch (error) {
      setAlert({
        isOpen: true,
        title: "Lỗi",
        message: (error as any)?.error.message || "Không thể tạo đơn hàng. Vui lòng thử lại.",
        variant: "danger",
      });
    }
  };

  return (
    <div className="space-y-6 min-h-[1000px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tạo Đơn Hàng Mới
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Chọn khách hàng, chọn kho, thêm sản phẩm và hoàn tất đơn hàng
          </p>
        </div>
        <Button variant="outline" size="ssmm" onClick={() => router.push("/sales/orders")}>
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Customer Selection */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              1. Chọn khách hàng
            </h2>
            <CustomerSelector
              selectedCustomer={selectedCustomer}
              onSelect={setSelectedCustomer}
            />
          </div>

          {/* Step 2: Warehouse Selection */}
          {selectedCustomer && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                2. Chọn kho xuất hàng
              </h2>
              <WarehouseSelector
                selectedWarehouseId={selectedWarehouseId}
                onSelect={setSelectedWarehouseId}
                salesChannel={salesChannel}
              />
            </div>
          )}

          {/* Step 3: Add Products */}
          {selectedCustomer && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                3. Thêm sản phẩm
              </h2>
              <ProductCart
                items={cart.items}
                onAddItem={cart.addItem}
                onRemoveItem={cart.removeItem}
                onUpdateQuantity={cart.updateQuantity}
                onUpdatePrice={cart.updatePrice}
                onUpdateDiscount={cart.updateDiscount}
                onUpdateTax={cart.updateTax}
                warehouseId={selectedWarehouseId || undefined}
                customerClassification={selectedCustomer.classification}
              />
            </div>
          )}

          {/* Step 4: Order Details */}
          {selectedCustomer && cart.items.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                4. Thông tin đơn hàng
              </h2>

              <div className="space-y-4">
                {/* Pickup vs Delivery Toggle */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hình thức nhận hàng <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="pickup"
                        checked={isPickupOrder}
                        onChange={() => setIsPickupOrder(true)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Lấy ngay (Hoàn thành ngay)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="delivery"
                        checked={!isPickupOrder}
                        onChange={() => setIsPickupOrder(false)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Giao hàng tận nơi</span>
                    </label>
                  </div>
                  {isPickupOrder && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                      ✓ Đơn sẽ được hoàn thành ngay, trừ tồn kho qua warehouse
                    </p>
                  )}
                  {!isPickupOrder && (
                    <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                      ✓ Giữ chỗ hàng, chuyển sang trạng thái chờ xử lý
                    </p>
                  )}
                </div>

                {/* Sales Channel */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Kênh bán hàng <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={salesChannel}
                    onChange={(e) => setSalesChannel(e.target.value as SalesChannel)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="retail">{SALES_CHANNEL_LABELS.retail}</option>
                    <option value="wholesale">{SALES_CHANNEL_LABELS.wholesale}</option>
                    <option value="online">{SALES_CHANNEL_LABELS.online}</option>
                    <option value="distributor">{SALES_CHANNEL_LABELS.distributor}</option>
                  </select>
                </div>

                {/* Delivery Details - Show only when not pickup */}
                {!isPickupOrder && (
                  <>
                    {/* Recipient Name */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Người nhận hàng
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder={selectedCustomer?.customerName || "Nhập tên người nhận..."}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    {/* Recipient Phone */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        SĐT người nhận
                      </label>
                      <input
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder={selectedCustomer?.phone || "Nhập SĐT người nhận..."}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    {/* Delivery Address */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Địa chỉ giao hàng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder={selectedCustomer?.address || "Nhập địa chỉ giao hàng..."}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>

                    {/* Shipping Fee */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phí vận chuyển (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={shippingFee}
                        onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                        min="0"
                        step="1000"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </>
                )}

                {/* Notes */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ghi chú
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Ghi chú về đơn hàng..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {selectedCustomer && cart.items.length > 0 && (
            <div className="flex justify-end gap-3">
              <Link href="/sales/orders">
                <Button variant="outline">Hủy</Button>
              </Link>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!canSubmit || willExceedLimit || createOrder.isPending}
              >
                <Save className="mr-2 h-5 w-5" />
                {createOrder.isPending ? "Đang tạo..." : "Tạo đơn hàng"}
              </Button>
            </div>
          )}
        </div>

        {/* Right Column - Order Summary (Sticky) */}
        {selectedCustomer && cart.items.length > 0 && (
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <OrderSummary
                summary={cart.summary}
                paymentMethod={paymentMethod}
                paidAmount={paidAmount}
                customer={selectedCustomer}
                onPaymentMethodChange={setPaymentMethod}
                onPaidAmountChange={setPaidAmount}
              />
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      {!selectedCustomer && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            💡 Bắt đầu bằng cách chọn khách hàng để tạo đơn hàng
          </p>
        </div>
      )}

      {selectedCustomer && cart.items.length === 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-900 dark:text-yellow-300">
            💡 Tìm kiếm và thêm sản phẩm vào đơn hàng
          </p>
        </div>
      )}

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alert.isOpen}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        title={alert.title}
        message={alert.message}
        variant={alert.variant}
      />
    </div>
  );
}
