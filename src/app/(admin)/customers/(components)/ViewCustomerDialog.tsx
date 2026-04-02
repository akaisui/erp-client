"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCustomer,
  useCustomerDebt,
  useCustomerOrders,
  useUpdateCreditLimit,
  useUpdateCustomerStatus,
  useDeleteCustomer,
} from "@/hooks/api";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import { Modal } from "@/components/ui/modal";
import {
  updateCreditLimitSchema,
  updateCustomerStatusSchema,
  type UpdateCreditLimitInput,
  type UpdateCustomerStatusInput,
} from "@/lib/validations";
import {
  ApiResponse,
  Customer,
  CustomerDebtInfo,
  CustomerOrderHistory,
} from "@/types";
import {
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  CreditCard,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Receipt,
  FileCheck,
  X,
  Shield,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import {
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_CLASSIFICATION_LABELS,
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUSES,
  GENDER_LABELS,
} from "@/lib/constants";
import { Can } from "@/components/auth";

interface ViewCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number | null;
  onEdit?: (customer: Customer) => void;
}

export function ViewCustomerDialog({
  isOpen,
  onClose,
  customerId,
  onEdit,
}: ViewCustomerDialogProps) {
  const router = useRouter();

  const [showCreditLimitModal, setShowCreditLimitModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showQuickPaymentModal, setShowQuickPaymentModal] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "payments" | "reconciliations">("orders");

  // Fetch data
  const { data, isLoading, error } = useCustomer(customerId || 0);
  const response = data as unknown as ApiResponse<Customer>;
  const customer = response?.data;

  // Only fetch related data if customer exists
  const hasCustomer = !!customer;
  
  const { data: debtData } = useCustomerDebt(customerId || 0, hasCustomer);
  const debtResponse = debtData as unknown as ApiResponse<CustomerDebtInfo>;
  const debtInfo = debtResponse?.data;

  const { data: ordersData } = useCustomerOrders(customerId || 0, 1, 10, hasCustomer);
  const ordersResponse = ordersData as unknown as ApiResponse<CustomerOrderHistory>;
  const orderHistory = ordersResponse?.data;

  // Mutations
  const updateCreditLimit = useUpdateCreditLimit();
  const updateStatus = useUpdateCustomerStatus();
  const deleteCustomer = useDeleteCustomer();

  // Credit Limit form
  const {
    register: registerCreditLimit,
    handleSubmit: handleSubmitCreditLimit,
    formState: { errors: errorsCreditLimit },
    reset: resetCreditLimit,
  } = useForm<UpdateCreditLimitInput>({
    resolver: zodResolver(updateCreditLimitSchema),
    defaultValues: {
      creditLimit: customer?.creditLimit || 0,
    },
  });

  // Status form
  const {
    register: registerStatus,
    handleSubmit: handleSubmitStatus,
    formState: { errors: errorsStatus },
  } = useForm<UpdateCustomerStatusInput>({
    resolver: zodResolver(updateCustomerStatusSchema),
    defaultValues: {
      status: customer?.status || "active",
    },
  });

  // Handle Update Credit Limit
  const onCreditLimitSubmit = async (data: UpdateCreditLimitInput) => {
    if (!customerId) return;
    try {
      await updateCreditLimit.mutateAsync({ id: customerId, data });
      setShowCreditLimitModal(false);
      resetCreditLimit();
    } catch (error) {
      console.error("Failed to update credit limit:", error);
    }
  };

  // Handle Update Status
  const onStatusSubmit = async (data: UpdateCustomerStatusInput) => {
    if (!customerId) return;
    try {
      await updateStatus.mutateAsync({ id: customerId, data });
      setShowStatusModal(false);
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!customer || !customerId) return;
    try {
      await deleteCustomer.mutateAsync(customerId);
      onClose();
      // Optionally trigger list refresh here if needed, but react-query usually handles it via invalidation
    } catch (error) {
      console.error("Failed to delete customer:", error);
    }
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      containerClassName="!p-[5px] !items-center !justify-center"
      className="!max-w-none !w-full !h-full !rounded-2xl flex flex-col p-0 overflow-hidden animate-slide-up shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Chi tiết Khách hàng
          </h2>
          {customer && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {customer.customerName} - {customer.customerCode}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
            </div>
          </div>
        ) : error || !customer ? (
          <div className="flex h-full items-center justify-center">
             <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <h3 className="font-semibold text-red-900 dark:text-red-300">
                  Lỗi khi tải thông tin khách hàng
                </h3>
                <p className="mt-1 text-sm text-red-800 dark:text-red-400">
                  {(error as any)?.message || "Không tìm thấy khách hàng"}
                </p>
              </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Financial Stats Cards */}
            {debtInfo && (
              <div className="grid gap-6 md:grid-cols-3">
                {/* Card 1: Current Debt */}
                <div className={`rounded-lg border p-6 ${
                  debtInfo.currentDebt > debtInfo.creditLimit 
                    ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-900/20" 
                    : debtInfo.currentDebt > 0
                    ? "border-yellow-300 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20"
                    : "border-green-300 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Công nợ hiện tại
                      </p>
                      <p className={`mt-2 text-3xl font-bold ${
                        debtInfo.currentDebt > debtInfo.creditLimit 
                          ? "text-red-600 dark:text-red-400" 
                          : debtInfo.currentDebt > 0
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-green-600 dark:text-green-400"
                      }`}>
                        {formatCurrency(debtInfo.currentDebt)}
                      </p>
                    </div>
                    <DollarSign className={`h-8 w-8 ${
                      debtInfo.currentDebt > debtInfo.creditLimit 
                        ? "text-red-600 dark:text-red-400" 
                        : debtInfo.currentDebt > 0
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-green-600 dark:text-green-400"
                    }`} />
                  </div>
                  {debtInfo.currentDebt > 0 && debtInfo.debtUpdatedAt && (
                    <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                      Cập nhật: {format(new Date(debtInfo.debtUpdatedAt), "dd/MM/yyyy HH:mm")}
                    </p>
                  )}
                  {debtInfo.currentDebt > debtInfo.creditLimit && (
                    <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-red-600 dark:text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      Vượt hạn mức!
                    </p>
                  )}
                </div>

                {/* Card 2: Credit Limit & Progress */}
                <div className="rounded-lg border border-blue-300 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-900/20">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Hạn mức tín dụng
                      </p>
                      <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(debtInfo.creditLimit)}
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Đã sử dụng</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {debtInfo.creditLimit > 0 
                          ? Math.round((debtInfo.currentDebt / debtInfo.creditLimit) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          debtInfo.creditLimit > 0 && (debtInfo.currentDebt / debtInfo.creditLimit) * 100 >= 100
                            ? "bg-red-600"
                            : debtInfo.creditLimit > 0 && (debtInfo.currentDebt / debtInfo.creditLimit) * 100 >= 80
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            debtInfo.creditLimit > 0 ? (debtInfo.currentDebt / debtInfo.creditLimit) * 100 : 0,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Còn lại: <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(Math.max(0, debtInfo.creditLimit - debtInfo.currentDebt))}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Card 3: Total Revenue */}
                <div className="rounded-lg border border-purple-300 bg-purple-50 p-6 dark:border-purple-900 dark:bg-purple-900/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Tổng doanh số
                      </p>
                      <p className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(debtInfo?.totalRevenue || 0)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded bg-purple-200/30 p-2 dark:bg-purple-900/30">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Số đơn</p>
                      <p className="mt-1 font-semibold text-purple-700 dark:text-purple-300">
                        {debtInfo?.totalOrders || 0}
                      </p>
                    </div>
                    <div className="rounded bg-purple-200/30 p-2 dark:bg-purple-900/30">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Đã trả</p>
                      <p className="mt-1 font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(debtInfo?.totalPaid || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Customer Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Thông tin cơ bản
                  </h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Mã khách hàng</p>
                      <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                        {customer.customerCode}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Điểm thưởng</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-bold text-orange-600 dark:text-orange-400">
                          {customer.rewardPoints || 0}
                        </span>
                        <span className="text-xs text-gray-500">điểm</span>
                      </div>
                    </div>

                    {customer.rewardCode && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Mã thưởng</p>
                        <p className="mt-1 font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded inline-block text-sm border border-gray-200 dark:border-gray-700">
                          {customer.rewardCode}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Loại khách hàng</p>
                      <div className="mt-1">
                        <Badge color={customer.customerType === "individual" ? "blue" : "purple"}>
                          {CUSTOMER_TYPE_LABELS[customer.customerType]}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phân loại</p>
                      <div className="mt-1">
                        <Badge color={
                          customer.classification === "retail" ? "blue" :
                          customer.classification === "wholesale" ? "purple" :
                          customer.classification === "vip" ? "red" :
                          "orange"
                        }>
                          {CUSTOMER_CLASSIFICATION_LABELS[customer.classification]}
                        </Badge>
                      </div>
                    </div>

                    {customer.gender && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Giới tính</p>
                        <p className="mt-1 text-gray-900 dark:text-white">
                          {GENDER_LABELS[customer.gender]}
                        </p>
                      </div>
                    )}

                    {customer.contactPerson && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Người liên hệ</p>
                        <p className="mt-1 text-gray-900 dark:text-white">
                          {customer.contactPerson}
                        </p>
                      </div>
                    )}

                    {customer.taxCode && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Mã số thuế</p>
                        <p className="mt-1 text-gray-900 dark:text-white">
                          {customer.taxCode}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Thông tin liên hệ
                  </h2>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Số điện thoại</p>
                        <p className="text-gray-900 dark:text-white">{customer.phone}</p>
                      </div>
                    </div>

                    {customer.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                          <p className="text-gray-900 dark:text-white">{customer.email}</p>
                        </div>
                      </div>
                    )}

                    {(customer.address || customer.province) && (
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Địa chỉ</p>
                          <p className="text-gray-900 dark:text-white">
                            {customer.address && `${customer.address}, `}
                            {customer.district && `${customer.district}, `}
                            {customer.province}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Identity Information */}
                {(customer.cccd || customer.issuedAt || customer.issuedBy) && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                      Thông tin chứng thực
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {customer.cccd && (
                        <div className="flex items-start gap-3">
                           <Shield className="mt-0.5 h-5 w-5 text-gray-400" />
                           <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">CCCD/CMND</p>
                            <p className="mt-1 text-gray-900 dark:text-white font-semibold">
                              {customer.cccd}
                            </p>
                          </div>
                        </div>
                      )}

                      {customer.issuedAt && (
                        <div className="flex items-start gap-3">
                          <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Ngày cấp</p>
                            <p className="mt-1 text-gray-900 dark:text-white font-semibold">
                              {format(new Date(customer.issuedAt), "dd/MM/yyyy")}
                            </p>
                          </div>
                        </div>
                      )}

                      {customer.issuedBy && (
                        <div className="sm:col-span-2 flex items-start gap-3">
                          <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Nơi cấp</p>
                            <p className="mt-1 text-gray-900 dark:text-white">
                              {customer.issuedBy}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Activity Tabs */}
                <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 shadow-sm">
                  {/* Tab Headers */}
                  <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setActiveTab("orders")}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                        activeTab === "orders"
                          ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                    >
                      <ShoppingCart className="mb-1 inline mr-2 h-4 w-4" />
                      Đơn hàng
                    </button>
                    <button
                      onClick={() => setActiveTab("payments")}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                        activeTab === "payments"
                          ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                    >
                      <Receipt className="mb-1 inline mr-2 h-4 w-4" />
                      Thanh toán
                    </button>
                    <button
                      onClick={() => setActiveTab("reconciliations")}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                        activeTab === "reconciliations"
                          ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                    >
                      <FileCheck className="mb-1 inline mr-2 h-4 w-4" />
                      Đối chiếu
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
                    {/* Orders Tab */}
                    {activeTab === "orders" && (
                      <div className="space-y-3">
                        {orderHistory && orderHistory.orders.length > 0 ? (
                          orderHistory.orders.map((order: any) => (
                            <Link
                              href={`/sales/orders/${order.id}`}
                              key={order.id}
                              className="block"
                            >
                              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-colors">
                                <div className="flex items-center gap-3">
                                  <ShoppingCart className="h-5 w-5 text-gray-400" />
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {order.orderCode || `#${order.id}`}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {order.createdAt ? format(new Date(order.createdAt), "dd/MM/yyyy HH:mm") : "—"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {formatCurrency(order.totalAmount || 0)}
                                  </p>
                                  <Badge color={
                                    order.paymentStatus === "paid" ? "green" :
                                    order.paymentStatus === "partial" ? "yellow" :
                                    "gray"
                                  }>
                                    {order.paymentStatus === "paid" ? "Đã trả" :
                                     order.paymentStatus === "partial" ? "Trả một phần" :
                                     "Chưa trả"}
                                  </Badge>
                                </div>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400">Không có đơn hàng nào</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Payments Tab */}
                    {activeTab === "payments" && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                          Chức năng lịch sử thanh toán sẽ được cập nhật trong tương lai
                        </p>
                      </div>
                    )}

                    {/* Reconciliations Tab */}
                    {activeTab === "reconciliations" && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
                          Chức năng biên bản đối chiếu sẽ được cập nhật trong tương lai
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {customer.notes && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                      Ghi chú
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300">{customer.notes}</p>
                  </div>
                )}
              </div>

              {/* Right Column - Quick Actions & Stats */}
              <div className="space-y-6">
                {/* Primary Actions Card */}
                <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 dark:border-blue-900 dark:from-blue-950 dark:to-gray-900 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Thao tác nhanh
                  </h3>

                  <div className="space-y-3">
                    {debtInfo && (
                      <Can permission="update_customer">
                        <button
                          onClick={() => {
                            resetCreditLimit({ creditLimit: customer.creditLimit });
                            setShowCreditLimitModal(true);
                          }}
                          className="group w-full rounded-lg border border-blue-300 bg-white p-4 text-left transition-all hover:border-blue-500 hover:shadow-md dark:border-blue-800 dark:bg-gray-800"
                        >
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-900/30">
                              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white">Cập nhật hạn mức</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Thay đổi hạn mức tín dụng
                              </p>
                            </div>
                          </div>
                        </button>
                      </Can>
                    )}

                    {debtInfo && debtInfo.currentDebt > 0 && (
                      <Can permission="create_payment_receipt">
                        <button
                          onClick={() => setShowQuickPaymentModal(true)}
                          className="group w-full rounded-lg border border-green-300 bg-white p-4 text-left transition-all hover:border-green-500 hover:shadow-md dark:border-green-800 dark:bg-gray-800"
                        >
                          <div className="flex items-start gap-3">
                            <div className="rounded-lg bg-green-100 p-2.5 dark:bg-green-900/30">
                              <Receipt className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white">Thu nợ nhanh</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Công nợ: {formatCurrency(debtInfo.currentDebt)}
                              </p>
                            </div>
                          </div>
                        </button>
                      </Can>
                    )}
                  </div>
                </div>

                {/* Secondary Actions Card */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Thao tác khác
                  </h3>

                  <div className="space-y-2">
                    <Can permission="update_customer">
                      <button
                        onClick={() => setShowStatusModal(true)}
                        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-left transition-all hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Cập nhật trạng thái
                          </span>
                        </div>
                      </button>
                    </Can>
                  </div>
                </div>

                {/* Metadata */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Thông tin hệ thống
                  </h2>

                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Ngày tạo</p>
                      <p className="mt-1 font-medium text-gray-900 dark:text-white">
                        {format(new Date(customer.createdAt), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>

                    {customer.updatedAt && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Cập nhật gần nhất</p>
                        <p className="mt-1 font-medium text-gray-900 dark:text-white">
                          {format(new Date(customer.updatedAt), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                    )}

                    {customer.debtUpdatedAt && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Cập nhật công nợ</p>
                        <p className="mt-1 font-medium text-gray-900 dark:text-white">
                          {format(new Date(customer.debtUpdatedAt), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                    )}

                    {customer.creator && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Người tạo</p>
                        <p className="mt-1 font-medium text-gray-900 dark:text-white">
                          {customer.creator.fullName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

       {/* Footer - Pinned to bottom */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
         <Can permission="create_debt_reconciliation">
            <Button
              variant="outline"
              size="ssm"
              onClick={() => router.push(`/debt-reconciliation/create?customerId=${customerId}`)}
            >
              <FileCheck className="mr-2 h-4 w-4" />
              Đối chiếu
            </Button>
          </Can>

          <Can permission="create_sales_order">
            <Button
              variant="primary"
              size="ssm"
              onClick={() => router.push(`/sales/orders/create?customerId=${customerId}`)}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Tạo đơn hàng
            </Button>
          </Can>

           <Can permission="update_customer">
            <Button
              variant="primary"
              size="ssm"
              onClick={() => {
                  if (onEdit && customer) {
                      onEdit(customer);
                  } else {
                      router.push(`/customers/${customerId}/edit`);
                  }
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Sửa
            </Button>
          </Can>

          <Can permission="delete_customer">
            <Button
              variant="danger"
              size="ssm"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={deleteCustomer.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </Button>
          </Can>

          <Button variant="outline" size="ssm" onClick={onClose}>
            Đóng
          </Button>
      </div>

      {/* Update Credit Limit Modal */}
      {showCreditLimitModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Cập nhật hạn mức công nợ
            </h3>

            <form onSubmit={handleSubmitCreditLimit(onCreditLimitSubmit)} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Hạn mức mới (VND) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...registerCreditLimit("creditLimit", { valueAsNumber: true })}
                  min="0"
                  step="1000"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                />
                {errorsCreditLimit.creditLimit && (
                  <p className="mt-1 text-sm text-red-600">
                    {errorsCreditLimit.creditLimit.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lý do thay đổi
                </label>
                <textarea
                  {...registerCreditLimit("reason")}
                  rows={3}
                  placeholder="VD: Khách hàng thanh toán đúng hạn, tăng hạn mức..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreditLimitModal(false);
                    resetCreditLimit();
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit" variant="primary" disabled={updateCreditLimit.isPending}>
                  {updateCreditLimit.isPending ? "Đang cập nhật..." : "Cập nhật"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Cập nhật trạng thái khách hàng
            </h3>

            <form onSubmit={handleSubmitStatus(onStatusSubmit)} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <select
                  {...registerStatus("status")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                >
                  {Object.values(CUSTOMER_STATUSES).map((status) => (
                    <option key={status} value={status}>
                      {CUSTOMER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
                {errorsStatus.status && (
                  <p className="mt-1 text-sm text-red-600">{errorsStatus.status.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lý do thay đổi
                </label>
                <textarea
                  {...registerStatus("reason")}
                  rows={3}
                  placeholder="VD: Khách hàng vi phạm điều khoản thanh toán..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowStatusModal(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" variant="primary" disabled={updateStatus.isPending}>
                  {updateStatus.isPending ? "Đang cập nhật..." : "Cập nhật"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Payment Receipt Modal */}
      {showQuickPaymentModal && debtInfo && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Lập phiếu thu nhanh
            </h3>

            <form className="space-y-4">
              <div>
                <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                  Công nợ hiện tại: <span className="font-bold text-red-600">{formatCurrency(debtInfo.currentDebt)}</span>
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Số tiền thu (VND) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max={debtInfo.currentDebt}
                  step="10000"
                  placeholder="0"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Hình thức thanh toán <span className="text-red-500">*</span>
                </label>
                <select className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-700 dark:text-white">
                  <option value="cash">Tiền mặt</option>
                  <option value="transfer">Chuyển khoản</option>
                  <option value="check">Séc</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: Thanh toán đơn hàng DH001..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQuickPaymentModal(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" variant="primary">
                  Lập phiếu thu
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Xóa khách hàng"
        message={`Bạn có chắc chắn muốn xóa khách hàng "${customer?.customerName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteCustomer.isPending}
      />
    </Modal>
  );
}
