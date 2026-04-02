"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  useDelivery,
  useUpdateDeliveryStatus,
  useSettleDelivery,
  useDeleteDelivery,
  useFailDelivery,
  useAssignDeliveryStaff,
  useUsers,
} from "@/hooks/api";
import Button from "@/components/ui/button/Button";
import DeliveryStatus, {
  DeliveryStatusStepper,
  DeliveryStatusSelect,
} from "@/components/sales/DeliveryStatus";
import ProofUpload, { ProofDisplay } from "@/components/sales/ProofUpload";
import {
  ApiResponse,
  Delivery,
  DeliveryStatus as DeliveryStatusType,
  UpdateDeliveryStatusDto,
} from "@/types";
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
  Truck,
  AlertCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Can } from "@/components/auth";

export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deliveryId = parseInt(params.id as string);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);

  // Fetch Users (for staff assignment)
  const { data: usersData } = useUsers({ page: 1, limit: 100 });
  const users = (usersData as any)?.data || []; // Safe cast if types are messy
  const staffList = Array.isArray(users) ? users : []; 

  // Fetch data
  const { data, isLoading, error } = useDelivery(deliveryId);
  const response = data as unknown as ApiResponse<Delivery>;
  const delivery = response?.data;

  // Mutations
  const updateStatus = useUpdateDeliveryStatus();
  const failDelivery = useFailDelivery();
  const settle = useSettleDelivery();
  const deleteDelivery = useDeleteDelivery();
  const assignStaff = useAssignDeliveryStaff();

  // Status form
  const [selectedStatus, setSelectedStatus] = useState<DeliveryStatusType>("delivered");
  const [statusData, setStatusData] = useState<Partial<UpdateDeliveryStatusDto> & { cancelOrder?: boolean }>({});

  // Handle Update Status
  const handleUpdateStatus = async () => {
    if (!delivery) return;

    try {
      if (selectedStatus === 'failed') {
          await failDelivery.mutateAsync({
            id: deliveryId,
            data: {
              failureReason: statusData.failureReason || 'Giao hàng thất bại',
              notes: statusData.notes,
              cancelOrder: statusData.cancelOrder,
            },
          });
      } else {
        await updateStatus.mutateAsync({
          id: deliveryId,
          data: {
            deliveryStatus: selectedStatus,
            ...statusData,
          },
        });
      }
      setShowStatusModal(false);
      setStatusData({});
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  // Handle Settle
  const handleSettle = async () => {
    if (!delivery) return;

    const confirmed = window.confirm(
      `Quyết toán giao hàng "${delivery.deliveryCode}"?\n\nSố tiền COD đã thu: ${formatCurrency(delivery.collectedAmount)}`
    );

    if (!confirmed) return;

    try {
      await settle.mutateAsync({ id: deliveryId, data: {} });
      setShowSettleModal(false);
    } catch (error) {
      console.error("Failed to settle delivery:", error);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!delivery) return;

    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa phiếu giao hàng "${delivery.deliveryCode}"?\n\nHành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    try {
      await deleteDelivery.mutateAsync(deliveryId);
      router.push("/sales/deliveries");
    } catch (error) {
      console.error("Failed to delete delivery:", error);
    }
  };

  // Handle Assign Staff
  const handleAssignStaff = async () => {
      if (!delivery || !selectedStaffId) return;
      
      try {
          await assignStaff.mutateAsync({
              id: deliveryId,
              deliveryStaffId: selectedStaffId
          });
          setShowAssignModal(false);
      } catch (error) {
          console.error("Failed to assign staff", error);
      }
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

  if (error || !delivery) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <h3 className="font-semibold text-red-900 dark:text-red-300">
          Lỗi khi tải thông tin giao hàng
        </h3>
        <p className="mt-1 text-sm text-red-800 dark:text-red-400">
          {(error as any)?.message || "Không tìm thấy phiếu giao hàng"}
        </p>
      </div>
    );
  }

  const canUpdateStatus =
    delivery.deliveryStatus === "pending" || delivery.deliveryStatus === "in_transit";
  const canSettle =
    delivery.deliveryStatus === "delivered" &&
    delivery.codAmount > 0 &&
    delivery.settlementStatus === "pending";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <Link
              href="/sales/deliveries"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {delivery.deliveryCode}
            </h1>
            <DeliveryStatus delivery={delivery} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tạo lúc {format(new Date(delivery.createdAt), "dd/MM/yyyy HH:mm")}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Can permission="sales.update">
            {canUpdateStatus && (
              <Button
                variant="primary"
                startIcon={<CheckCircle className="h-4 w-4" />}
                onClick={() => setShowStatusModal(true)}
              >
                Cập nhật trạng thái
              </Button>
            )}

            {/* Assign Staff Button */}
            {delivery.deliveryStatus === 'pending' && (
                <Button
                    variant="outline"
                    startIcon={<User className="h-4 w-4" />}
                    onClick={() => setShowAssignModal(true)}
                >
                    Phân công
                </Button>
            )}

            {canSettle && (
              <Button variant="success" startIcon={<DollarSign className="h-4 w-4" />} onClick={handleSettle}>
                Quyết toán
              </Button>
            )}
          </Can>

          <Can permission="sales.delete">
            {delivery.deliveryStatus === "pending" && (
              <Button
                variant="danger"
                startIcon={<Trash2 className="h-4 w-4" />}
                onClick={handleDelete}
                loading={deleteDelivery.isPending}
              >
                Xóa
              </Button>
            )}
          </Can>
          
          <Can permission="sales.create">
             {/* Redirect Button - Logic: Fail Current -> Create New */}
             {(delivery.deliveryStatus === 'in_transit' || delivery.deliveryStatus === 'pending') && (
                <Button
                  variant="warning"
                  startIcon={<Truck className="h-4 w-4" />}
                  onClick={() => {
                     if(window.confirm("Bắt đầu quy trình chuyển hoàn & tạo đơn mới?\n\nHệ thống sẽ:\n1. Hủy đơn hiện tại & Trả hàng về kho.\n2. Chuyển bạn đến trang tạo đơn mới.")) {
                        failDelivery.mutateAsync({
                            id: deliveryId,
                            data: {
                                failureReason: 'Chuyển hoàn & Tạo đơn mới',
                                cancelOrder: true
                            }
                        }).then(() => {
                            router.push(`/sales/orders/create?from_delivery=${deliveryId}`);
                        });
                     }
                  }}
                >
                  Chuyển hoàn & Tạo đơn mới
                </Button>
             )}
          </Can>
        </div>
      </div>

      {/* Status Stepper */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <DeliveryStatusStepper delivery={delivery} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Package className="h-5 w-5" />
              Thông tin đơn hàng
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Mã đơn hàng:
                </span>
                <Link
                  href={`/sales/orders/${delivery.orderId}`}
                  className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  {delivery.order?.orderCode}
                </Link>
              </div>

              {delivery.order?.customer && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Khách hàng:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {delivery.order.customer.customerName}
                    </span>
                  </div>

                  {delivery.order.customer.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Số điện thoại:
                      </span>
                      <a
                        href={`tel:${delivery.order.customer.phone}`}
                        className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        <Phone className="h-4 w-4" />
                        {delivery.order.customer.phone}
                      </a>
                    </div>
                  )}
                </>
              )}

              {delivery.order?.deliveryAddress && (
                <div className="flex gap-2">
                  <MapPin className="h-5 w-5 flex-shrink-0 text-gray-400" />
                  <div className="flex-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Địa chỉ giao hàng:
                    </span>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {delivery.order.deliveryAddress}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Truck className="h-5 w-5" />
              Thông tin giao hàng
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Nhân viên giao hàng:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {delivery.deliveryStaff?.full_name || "-"}
                </span>
              </div>

              {delivery.shippingPartner && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Đối tác vận chuyển:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {delivery.shippingPartner}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Ngày giao:
                </span>
                <span className="flex items-center gap-1 font-medium text-gray-900 dark:text-white">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(delivery.deliveryDate), "dd/MM/yyyy")}
                </span>
              </div>

              {delivery.receivedBy && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Người nhận:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {delivery.receivedBy}
                    </span>
                  </div>

                  {delivery.receivedPhone && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        SĐT người nhận:
                      </span>
                      <a
                        href={`tel:${delivery.receivedPhone}`}
                        className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        {delivery.receivedPhone}
                      </a>
                    </div>
                  )}
                </>
              )}

              {delivery.failureReason && (
                <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="text-sm font-medium text-red-900 dark:text-red-300">
                        Lý do thất bại:
                      </p>
                      <p className="mt-1 text-sm text-red-800 dark:text-red-400">
                        {delivery.failureReason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {delivery.notes && (
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Ghi chú:
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {delivery.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Proof of Delivery */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <FileText className="h-5 w-5" />
              Ảnh chứng minh giao hàng
            </h2>

            {delivery.deliveryProof ? (
              <ProofDisplay proofUrl={delivery.deliveryProof} />
            ) : delivery.deliveryStatus === "delivered" ||
              delivery.deliveryStatus === "in_transit" ? (
              <Can permission="sales.update">
                <ProofUpload
                  deliveryId={deliveryId}
                  currentProof={delivery.deliveryProof}
                />
              </Can>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chưa có ảnh chứng minh
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <DollarSign className="h-5 w-5" />
              Thông tin tài chính
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Phí giao hàng:
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(delivery.deliveryCost)}
                </span>
              </div>

              {delivery.codAmount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      COD:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(delivery.codAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Đã thu:
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(delivery.collectedAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Còn lại:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(
                        delivery.codAmount - delivery.collectedAmount
                      )}
                    </span>
                  </div>
                </>
              )}

              {delivery.settlementStatus === "settled" && delivery.settledAt && (
                <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-900 dark:text-green-300">
                      Đã quyết toán
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                    {format(new Date(delivery.settledAt), "dd/MM/yyyy HH:mm")}
                  </p>
                  {delivery.settler && (
                    <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                      Bởi: {delivery.settler.full_name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Clock className="h-5 w-5" />
              Thông tin hệ thống
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tạo lúc:</span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(delivery.createdAt), "dd/MM/yyyy HH:mm")}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Cập nhật:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(delivery.updatedAt), "dd/MM/yyyy HH:mm")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Cập nhật trạng thái giao hàng
            </h3>

            <div className="space-y-4">
              {/* Status Select */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Trạng thái
                </label>
                <DeliveryStatusSelect
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                />
              </div>

              {/* Conditional Fields */}
              {selectedStatus === "delivered" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Người nhận
                    </label>
                    <input
                      type="text"
                      value={statusData.receivedBy || ""}
                      onChange={(e) =>
                        setStatusData({ ...statusData, receivedBy: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
                      placeholder="Tên người nhận"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      SĐT người nhận
                    </label>
                    <input
                      type="tel"
                      value={statusData.receivedPhone || ""}
                      onChange={(e) =>
                        setStatusData({
                          ...statusData,
                          receivedPhone: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
                      placeholder="Số điện thoại"
                    />
                  </div>

                  {delivery.codAmount > 0 && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Số tiền đã thu (COD)
                      </label>
                      <input
                        type="number"
                        value={statusData.collectedAmount || 0}
                        onChange={(e) =>
                          setStatusData({
                            ...statusData,
                            collectedAmount: parseFloat(e.target.value),
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
                        placeholder="0"
                      />
                    </div>
                  )}
                </>
              )}

              {selectedStatus === "failed" && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Lý do thất bại
                  </label>
                  <textarea
                    value={statusData.failureReason || ""}
                    onChange={(e) =>
                      setStatusData({
                        ...statusData,
                        failureReason: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
                    placeholder="Nhập lý do giao hàng thất bại..."
                  />
                </div>
              )}
              
              {selectedStatus === "failed" && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cancelOrder"
                    checked={statusData.cancelOrder || false}
                    onChange={(e) =>
                      setStatusData({
                        ...statusData,
                        cancelOrder: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="cancelOrder" className="text-sm font-medium text-red-600 dark:text-red-400">
                    Hủy đơn hàng & Trả hàng về kho (Không cần duyệt)
                  </label>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ghi chú
                </label>
                <textarea
                  value={statusData.notes || ""}
                  onChange={(e) =>
                    setStatusData({ ...statusData, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
                  placeholder="Ghi chú (tùy chọn)"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusData({});
                }}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateStatus}
                loading={updateStatus.isPending}
                className="flex-1"
              >
                Cập nhật
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Assign Staff Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
             <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
               Phân công nhân viên giao hàng
             </h3>
             
             <div className="space-y-4">
                <div>
                   <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Chọn nhân viên
                   </label>
                   <select
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
                      value={selectedStaffId || ""}
                      onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                   >
                       <option value="">-- Chọn nhân viên --</option>
                       {staffList.map(user => (
                           <option key={user.id} value={user.id}>
                               {user.full_name} ({user.username})
                           </option>
                       ))}
                   </select>
                </div>
                
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1"
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleAssignStaff}
                    loading={assignStaff.isPending}
                    className="flex-1"
                    disabled={!selectedStaffId}
                  >
                    Lưu
                  </Button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
