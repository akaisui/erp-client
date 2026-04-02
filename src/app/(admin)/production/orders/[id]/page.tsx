"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useProductionOrder,
  useStartProduction,
  useCompleteProduction,
  useCancelProductionOrder,
  useWastageReport,
  useDeleteProductionOrder,
  useCalculateMaterials,
} from "@/hooks/api";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import {
  MaterialRequirements,
  WastageReport,
  ProductionTimeline,
} from "@/components/production";
import {
  completeProductionSchema,
  cancelProductionSchema,
  type CancelProductionInput,
  CompleteProductionInput,
} from "@/lib/validations";
import { ApiResponse, ProductionOrder, WastageReport as WastageReportType, MaterialShortage } from "@/types";
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  DollarSign,
  BarChart3,
  Trash2,
  Edit,
  Printer,
  Flag,
  X,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PRODUCTION_STATUS_LABELS, PRODUCTION_STATUS_COLORS } from "@/lib/constants";
import toast from "react-hot-toast";

export default function ProductionOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = parseInt(params.id as string);

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [startNotes, setStartNotes] = useState("");
  const [materialShortages, setMaterialShortages] = useState<MaterialShortage[]>([]);

  // Fetch data
  const { data, isLoading, error } = useProductionOrder(orderId);
  const response = data as unknown as ApiResponse<ProductionOrder>;
  const order = response?.data;

  const { data: wastageData } = useWastageReport(
    orderId,
    order?.status === "completed"
  );
  const wastageResponse = wastageData as unknown as ApiResponse<WastageReportType>;
  const wastageReport = wastageResponse?.data;

  // Mutations
  const startProduction = useStartProduction();
  const completeProduction = useCompleteProduction();
  const cancelOrder = useCancelProductionOrder();
  const deleteOrder = useDeleteProductionOrder();
  const calculateMaterialsAPI = useCalculateMaterials();

  // Calculate material shortages for PENDING status
  React.useEffect(() => {
    if (order?.status === "pending" && order?.bom?.id && order?.plannedQuantity) {
      calculateMaterialsAPI
        .mutateAsync({
          bomId: order.bom.id,
          productionQuantity: Number(order.plannedQuantity),
        })
        .then((response) => {
          const result = response as unknown as ApiResponse<any>;
          if (result.data?.shortages) {
            setMaterialShortages(result.data.shortages);
          } else {
            setMaterialShortages([]);
          }
        })
        .catch((error) => {
          console.error("Failed to calculate materials:", error);
          setMaterialShortages([]);
        });
    } else {
      setMaterialShortages([]);
    }
  }, [order?.id, order?.status]);

  // Complete form
  const {
    register: registerComplete,
    handleSubmit: handleSubmitComplete,
    formState: { errors: errorsComplete },
  } = useForm({
    resolver: zodResolver(completeProductionSchema),
    defaultValues: {
      actualQuantity: order?.plannedQuantity || 0,
    },
  });

  // Cancel form
  const {
    register: registerCancel,
    handleSubmit: handleSubmitCancel,
    formState: { errors: errorsCancel },
  } = useForm<CancelProductionInput>({
    resolver: zodResolver(cancelProductionSchema),
  });

  // Handle Start Production
  const handleStart = async () => {
    if (!order) return;
    setShowStartDialog(true);
  };

  // Handle Print Export Receipt (Phiếu xuất kho)
  const handlePrintExportReceipt = () => {
    if (!order) return;
    
    // Tìm stock transaction từ materials
    const stockTransactionId = order.materials?.[0]?.stockTransactionId;
    
    if (!stockTransactionId) {
      toast.error("Không tìm thấy phiếu xuất kho");
      return;
    }

    // Mở window in từ /inventory/transactions/[id]/print
    const printWindow = window.open(
      `/inventory/transactions/${stockTransactionId}/print`,
      '_blank',
      'width=1200,height=800'
    );

    if (!printWindow) {
      toast.error("Không thể mở cửa sổ in. Vui lòng kiểm tra popup blocker.");
    }
  };

  // Handle Print Import Receipt (Phiếu nhập kho)
  const handlePrintImportReceipt = () => {
    if (!order) return;

    // Mở window in phiếu nhập kho (thành phẩm)
    const printWindow = window.open(
      `/reports/production-orders/${orderId}/import-receipt`,
      '_blank',
      'width=1200,height=800'
    );

    if (!printWindow) {
      toast.error("Không thể mở cửa sổ in. Vui lòng kiểm tra popup blocker.");
    }
  };

  // Handle Print Product Label (Nhãn sản phẩm)
  const handlePrintProductLabel = () => {
    if (!order) return;

    // Mở window in nhãn sản phẩm
    const printWindow = window.open(
      `/reports/production-orders/${orderId}/product-labels`,
      '_blank',
      'width=800,height=600'
    );

    if (!printWindow) {
      toast.error("Không thể mở cửa sổ in. Vui lòng kiểm tra popup blocker.");
    }
  };

  // Handle Confirm Start Production
  const handleConfirmStart = async () => {
    try {
      await startProduction.mutateAsync({
        id: orderId,
        data: startNotes ? { notes: startNotes } : undefined
      }).then(() => {
        setShowStartDialog(false);
        setStartNotes("");
      });
    } catch (error) {
      console.log("Start production error:");
    }
  };

  // Handle Complete Production
  const onCompleteSubmit = async (data: CompleteProductionInput) => {
    try {
      // Filter out empty materials (chỉ gửi materials có actualQuantity)
      const cleanData = {
        ...data,
        materials: data.materials?.filter(m => m.actualQuantity || m.wastage)
      };

      // Nếu không có materials nào, bỏ materials
      if (!cleanData.materials || cleanData.materials.length === 0) {
        delete cleanData.materials;
      }

      await completeProduction.mutateAsync({ id: orderId, data: cleanData });
      setShowCompleteModal(false);
    } catch (error) {
      console.error("Lỗi khi complete lệnh sản xuất:", error);
    }
  };

  // Handle Cancel Production
  const onCancelSubmit = async (data: CancelProductionInput) => {
    try {
      await cancelOrder.mutateAsync({ id: orderId, data });
      setShowCancelModal(false);
      router.push("/production/orders");
    } catch (error) {
      console.error("Failed to cancel production:", error);
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

  if (error || !order) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <h3 className="font-semibold text-red-900 dark:text-red-300">
          Lỗi khi tải thông tin lệnh sản xuất
        </h3>
        <p className="mt-1 text-sm text-red-800 dark:text-red-400">
          {(error as any)?.message || "Không tìm thấy lệnh sản xuất"}
        </p>
      </div>
    );
  }

  // Handle Delete
  const handleDelete = async () => {
    try {
      await deleteOrder.mutateAsync(orderId);
      router.push("/production/orders");
    } catch (error) {
      console.error("Failed to delete production order:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {order.orderCode}
            </h1>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                PRODUCTION_STATUS_COLORS[order.status]
              }`}
            >
              {PRODUCTION_STATUS_LABELS[order.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tạo ngày {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
              href="/production/orders"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
              <ArrowLeft className="h-5 w-5" />
              Quay lại
          </Link>
          {order.status === "pending" && (
            <>
              <Button
                variant="success"
                size="smm"
                onClick={handleStart}
              >
                <Play className="mr-2 h-5 w-5" />
                Bắt đầu sản xuất
              </Button>
              <Link href={`/production/orders/${orderId}/edit`}>
                <Button
                  variant="primary"
                  size="smm"
                >
                  <Edit className="mr-2 h-5 w-5" />
                  Chỉnh sửa
                </Button>
              </Link>
              <Button
                variant="danger"
                size="smm"
                onClick={() => setShowCancelModal(true)}
              >
                <XCircle className="mr-2 h-5 w-5" />
                Hủy lệnh
              </Button>
              <Button
                variant="danger"
                size="smm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-5 w-5" />
                Xóa lệnh
              </Button>
            </>
          )}

          {order.status === "in_progress" && (
            <>
              <Button
                variant="success"
                size="smm"
                onClick={() => setShowCompleteModal(true)}
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Hoàn thành
              </Button>
              <Button
                variant="outline"
                size="smm"
                onClick={() => handlePrintExportReceipt()}
                title="In phiếu xuất kho cho nhân viên nhặt hàng"
              >
                <Printer className="mr-2 h-5 w-5" />
                In phiếu xuất kho
              </Button>
            </>
          )}

          {order.status === "completed" && (
            <>
              <Button
                variant="outline"
                size="smm"
                onClick={() => handlePrintImportReceipt()}
                title="In phiếu xác nhận thành phẩm nhập kho"
              >
                <Printer className="mr-2 h-5 w-5" />
                In phiếu nhập kho
              </Button>
              <Button
                variant="outline"
                size="smm"
                onClick={() => handlePrintProductLabel()}
                title="In nhãn dán lên thành phẩm"
              >
                <Flag className="mr-2 h-5 w-5" />
                In nhãn sản phẩm
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Production Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Thông tin sản xuất
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Công thức BOM
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {order.bom?.bomCode} (v{order.bom?.version})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sản phẩm
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {order.finishedProduct?.productName}
                </p>
                <p className="text-xs text-gray-500">
                  SKU: {order.finishedProduct?.sku}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  SL Kế hoạch
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(order.plannedQuantity)}{" "}
                  <span className="text-sm text-gray-500">
                    {order.finishedProduct?.unit}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  SL Thực tế
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(order.actualQuantity)}{" "}
                  <span className="text-sm text-gray-500">
                    {order.finishedProduct?.unit}
                  </span>
                </p>
              </div>
              {order.warehouseId && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Kho nhập
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.warehouse?.warehouseName || "—"}
                  </p>
                </div>
              )}
              {order.notes && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ghi chú
                  </p>
                  <p className="text-gray-900 dark:text-white">{order.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Material Requirements */}
          {order.materials && order.materials.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {order.status === "pending" ? "Kiểm tra Khả dụng Kho" : "Nguyên liệu sản xuất"}
              </h2>
              <MaterialRequirements
                materials={order.materials}
                status={order.status as "pending" | "in_progress" | "completed"}
                shortages={order.status === "pending" ? materialShortages : undefined}
              />
            </div>
          )}

          {/* Wastage Report */}
          {order.status === "completed" && wastageReport && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Báo cáo hao hụt
              </h2>
              <WastageReport report={wastageReport} />
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <ProductionTimeline order={order} />
          </div>
        </div>

        {/* Right Column - Stats & Info */}
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Chi phí sản xuất
                  </p>
                  <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                    {Number(order.productionCost) === 0 ? "_" : formatCurrency(order.productionCost)}
                  </p>
                </div>
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                  <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            {order.status === "completed" && wastageReport && (
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tỷ lệ hiệu suất
                    </p>
                    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                      {Number(wastageReport.efficiencyRate).toFixed(2)}%
                    </p>
                  </div>
                  <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                    <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Production Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-3xl rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            {/* Header with close button */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Hoàn thành sản xuất
              </h3>
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                aria-label="Đóng"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitComplete(onCompleteSubmit)} className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Số lượng thực tế sản xuất <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    {...registerComplete("actualQuantity", { valueAsNumber: true })}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <span className="text-sm text-gray-500">{order?.finishedProduct?.unit}</span>
                </div>
                {errorsComplete.actualQuantity && (
                  <p className="mt-1 text-sm text-red-600">
                    {errorsComplete.actualQuantity.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Kế hoạch: {order?.plannedQuantity} {order?.finishedProduct?.unit}
                </p>
              </div>

              {/* Materials Adjustment */}
              {order?.materials && order.materials.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                  <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                    Nguyên liệu thực tế (Nếu có chỉnh sửa)
                  </h4>
                  <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
                    Chỉ nhập nếu số lượng thực tế khác so với kế hoạch
                  </p>

                  <div className="space-y-2">
                    {order.materials.map((material, index) => (
                      <div
                        key={material.id}
                        className="rounded-md border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
                      >
                        <div className="mb-2 text-sm">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {material.material?.productName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Kế hoạch: {material.plannedQuantity} {material.material?.unit}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                              Thực tế
                            </label>
                            <input
                              type="hidden"
                              {...registerComplete(`materials.${index}.materialId`, {
                                valueAsNumber: true,
                              })}
                              value={material.materialId}
                            />
                            <input
                              type="number"
                              step="0.01"
                              {...registerComplete(`materials.${index}.actualQuantity`, {
                                valueAsNumber: true,
                                required: false,
                              })}
                              placeholder="Để trống nếu không thay đổi"
                              className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                              Hao hụt
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              {...registerComplete(`materials.${index}.wastage`, {
                                valueAsNumber: true,
                                required: false,
                              })}
                              placeholder="Để trống nếu không có"
                              className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* Material Notes */}
                        <div className="mt-2">
                          <label className="mb-1 block text-xs text-gray-600 dark:text-gray-400">
                            Ghi chú nguyên liệu (tuỳ chọn)
                          </label>
                          <textarea
                            {...registerComplete(`materials.${index}.notes`, {
                              required: false,
                            })}
                            rows={2}
                            placeholder="Ví dụ: Bị ẩm, hỏng bao..."
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ghi chú
                </label>
                <textarea
                  {...registerComplete("notes")}
                  rows={3}
                  placeholder="Ví dụ: Hỏng 2 cái do lỗi máy..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="success"
                  className="flex-1"
                  isLoading={completeProduction.isPending}
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Hoàn thành
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCompleteModal(false)}
                >
                  Hủy
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Production Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Hủy lệnh sản xuất
            </h3>
            <form onSubmit={handleSubmitCancel(onCancelSubmit)} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lý do hủy <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...registerCancel("reason")}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Nhập lý do hủy lệnh sản xuất..."
                />
                {errorsCancel.reason && (
                  <p className="mt-1 text-sm text-red-600">
                    {errorsCancel.reason.message}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="danger"
                  className="flex-1"
                  isLoading={cancelOrder.isPending}
                >
                  <XCircle className="mr-2 h-5 w-5" />
                  Xác nhận hủy
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                >
                  Đóng
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Start Production Confirmation Dialog */}
      {showStartDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Bắt đầu sản xuất
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Bắt đầu sản xuất lệnh <span className="font-semibold">"{order?.orderCode}"</span>?
            </p>
            <p className="mb-4 text-xs text-blue-600 dark:text-blue-400">
              ℹ️ Nguyên liệu sẽ được xuất kho tự động theo định mức của BOM.
            </p>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ghi chú (tuỳ chọn)
              </label>
              <textarea
                value={startNotes}
                onChange={(e) => setStartNotes(e.target.value)}
                placeholder="Ví dụ: Xuất kho lúc 7:30 sáng, đội ngày..."
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleConfirmStart}
                variant="success"
                className="flex-1"
                isLoading={startProduction.isPending}
              >
                <Play className="mr-2 h-5 w-5" />
                Bắt đầu sản xuất
              </Button>
              <Button
                onClick={() => {
                  setShowStartDialog(false);
                  setStartNotes("");
                }}
                variant="outline"
              >
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Old Start Production Confirmation Dialog - REMOVED */}
      {/* Use the new dialog above instead */}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Xóa lệnh sản xuất"
        message={`Bạn có chắc chắn muốn xóa lệnh sản xuất "${order?.orderCode}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteOrder.isPending}
      />
    </div>
  );
}
