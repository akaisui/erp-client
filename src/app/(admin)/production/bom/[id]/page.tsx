"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useBOM, useApproveBOM, useDeleteBOM, useSetBOMInactive, useProductionOrders } from "@/hooks/api";
import { useInventory } from "@/hooks/api";
import { Can } from "@/components/auth";
import BOMCalculator from "@/components/production/BOMCalculator";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import CancelModal from "@/components/ui/modal/CancelModal";
import { ApiResponse, Bom } from "@/types";
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  XCircle,
  Trash2,
  Package,
  Clock,
  Activity,
  Calculator,
  X,
} from "lucide-react";
import { BOM_STATUS_LABELS } from "@/lib/constants";
import { format } from "date-fns";

export default function BOMDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bomId = parseInt(params.id as string);
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    action: "" as "approve" | "delete" | "",
    isLoading: false,
  });
  const [inactiveModal, setInactiveModal] = useState({
    isOpen: false,
    isLoading: false,
  });

  const { data, isLoading, error } = useBOM(bomId);
  const approveBOM = useApproveBOM();
  const deleteBOM = useDeleteBOM();
  const setInactive = useSetBOMInactive();
  const { data: productionOrdersData } = useProductionOrders({ bomId });
  const { data: inventoryData } = useInventory();

  const response = data as unknown as ApiResponse<Bom>;
  const bom = response?.data;

  const productionOrdersResponse = productionOrdersData as unknown as ApiResponse<any>;
  const productionOrders = productionOrdersResponse?.data || [];

  const inventoryResponse = inventoryData as unknown as ApiResponse<any>;
  const inventory = inventoryResponse?.data || [];

  // Handle Approve
  const handleApprove = async () => {
    if (!bom) return;
    setConfirmDialog({
      isOpen: true,
      title: "Phê duyệt BOM",
      message: `Bạn có chắc chắn muốn phê duyệt BOM "${bom.bomCode}"?`,
      action: "approve",
      isLoading: false,
    });
  };

  const confirmApprove = async () => {
    setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      await approveBOM.mutateAsync({ id: bomId });
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    } finally {
      setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!bom) return;
    setConfirmDialog({
      isOpen: true,
      title: "Xóa BOM",
      message: `Bạn có chắc chắn muốn xóa BOM "${bom.bomCode}"? Hành động này không thể hoàn tác.`,
      action: "delete",
      isLoading: false,
    });
  };

  const confirmDelete = async () => {
    setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteBOM.mutateAsync(bomId);
      router.push("/production/bom");
    } finally {
      setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Handle Set Inactive
  const handleSetInactive = async () => {
    if (!bom) return;
    setInactiveModal({ isOpen: true, isLoading: false });
  };

  const confirmSetInactive = async (reason: string) => {
    setInactiveModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await setInactive.mutateAsync({ id: bomId, reason });
      setInactiveModal((prev) => ({ ...prev, isOpen: false }));
    } finally {
      setInactiveModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !bom) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-900 dark:bg-red-900/20 dark:text-red-300">
        <h3 className="font-semibold">Lỗi khi tải BOM</h3>
        <p className="text-sm">{(error as any)?.message || "Không tìm thấy BOM"}</p>
      </div>
    );
  }

  // Separate materials by type
  const rawMaterials = bom.materials?.filter((m) => m.materialType === "raw_material") || [];
  const packagingMaterials = bom.materials?.filter((m) => m.materialType === "packaging") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {bom.bomCode}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Chi tiết công thức sản xuất
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
            <Link
                href="/production/bom"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                <ArrowLeft className="h-5 w-5" />
                Quay lại
            </Link>

          {/* Calculator Button */}
          {bom.status === "active" && (
            <Button
              variant="gradient"
              size="smm"
              onClick={() => setShowCalculator(!showCalculator)}
            >
              <Calculator className="mr-2 h-4 w-4" />
              {showCalculator ? "Ẩn" : "Máy tính"}
            </Button>
          )}

          {bom.status === "draft" && (
            <>
              <Can permission="update_bom">
                <Link href={`/production/bom/${bomId}/edit`}>
                  <Button variant="success" size="smm">
                    <Edit className="mr-2 h-4 w-4" />
                    Chỉnh sửa
                  </Button>
                </Link>
              </Can>

              <Can permission="approve_bom">
                <Button variant="primary" size="smm" onClick={handleApprove}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Phê duyệt
                </Button>
              </Can>

              <Can permission="delete_bom">
                <Button variant="danger" size="smm" onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Xóa
                </Button>
              </Can>
            </>
          )}

          {bom.status === "active" && (
            <Can permission="update_bom">
              <Button variant="danger" size="smm" onClick={handleSetInactive}>
                <XCircle className="mr-2 h-4 w-4" />
                Ngừng sử dụng
              </Button>
            </Can>
          )}

          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(
              bom.status
            )}`}
          >
            {BOM_STATUS_LABELS[bom.status]}
          </span>
        </div>
      </div>

      {/* BOM Calculator Modal */}
      {showCalculator && bom.status === "active" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-lg dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Máy tính BOM - {bom.bomCode}
              </h2>
              <button
                onClick={() => setShowCalculator(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-6">
              <BOMCalculator
                bomId={bomId}
                bomCode={bom.bomCode}
                outputQuantityPerBatch={Number(bom.outputQuantity)}
                finishedProductUnit={bom.finishedProduct?.unit || ""}
              />
            </div>
          </div>
        </div>
      )}

      {/* BOM Information */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Thông tin cơ bản
            </h3>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Mã BOM
                </dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                  {bom.bomCode}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Phiên bản
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {bom.version}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Sản phẩm thành phẩm
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  <div className="font-medium">{bom.finishedProduct?.productName}</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {bom.finishedProduct?.sku}
                  </div>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Sản lượng/mẻ
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {bom.outputQuantity} {bom.finishedProduct?.unit}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tỷ lệ hiệu suất
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {bom.efficiencyRate}%
                </dd>
              </div>

              {bom.productionTime && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Thời gian sản xuất
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {bom.productionTime} phút
                  </dd>
                </div>
              )}

              {bom.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Ghi chú
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {bom.notes}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Product Gallery */}
          {(bom.finishedProduct?.images?.length || 0 > 0) || (bom.finishedProduct?.videos?.length || 0 > 0) ? (
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Hình ảnh & Video Sản phẩm
              </h3>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Images Gallery */}
                {(bom.finishedProduct?.images?.length || 0) > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Hình ảnh ({bom.finishedProduct?.images?.length})
                    </h4>
                    <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                      {bom.finishedProduct?.images?.[selectedImageIndex]?.imageUrl && (
                        <img
                          src={bom.finishedProduct.images[selectedImageIndex].imageUrl}
                          alt={bom.finishedProduct.images[selectedImageIndex].altText || "Product image"}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {bom.finishedProduct?.images?.map((image, index) => (
                        <button
                          key={image.id}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                            selectedImageIndex === index
                              ? "border-blue-500"
                              : "border-gray-200 dark:border-gray-600"
                          }`}
                        >
                          <img
                            src={image.imageUrl}
                            alt={image.altText || "Thumbnail"}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Videos */}
                {(bom.finishedProduct?.videos?.length || 0) > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Video ({bom.finishedProduct?.videos?.length})
                    </h4>
                    <div className="aspect-video overflow-hidden rounded-lg bg-gray-900">
                      {bom.finishedProduct?.videos?.[selectedVideoIndex]?.videoUrl && (
                        <iframe
                          src={bom.finishedProduct.videos[selectedVideoIndex].videoUrl}
                          title={
                            bom.finishedProduct.videos[selectedVideoIndex].title ||
                            "Product video"
                          }
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {bom.finishedProduct?.videos?.map((video, index) => (
                        <button
                          key={video.id}
                          onClick={() => setSelectedVideoIndex(index)}
                          className={`flex-shrink-0 rounded-lg border-2 p-2 transition-all ${
                            selectedVideoIndex === index
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-gray-600"
                          }`}
                        >
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {video.title || `Video ${index + 1}`}
                          </div>
                          {video.duration && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {Math.floor(video.duration / 60)}:{(video.duration % 60)
                                .toString()
                                .padStart(2, "0")}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
          {rawMaterials.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Nguyên liệu thô ({rawMaterials.length})
              </h3>

              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                        Nguyên liệu
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                        Số lượng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                        Đơn vị
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                        Ghi chú
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {rawMaterials.map((material) => (
                      <tr key={material.id}>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {material.material?.productName}
                              </div>
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">
                              {material.material?.sku}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{material.quantity}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {material.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {material.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Packaging Materials */}
            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    Bao bì ({packagingMaterials.length})
                </h3>
              {packagingMaterials.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Chưa có bao bì nào sử dụng trong công thức này
                </p>
                ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                        Bao bì
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                        Số lượng 
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                        Đơn vị
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                        Ghi chú
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {packagingMaterials.map((material) => (
                      <tr key={material.id}>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {material.material?.productName}
                              </div>
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">
                              {material.material?.sku}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{material.quantity}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {material.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {material.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>

          {/* Usage History */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Lệnh sản xuất liên quan ({productionOrders.length})
              </h3>
            </div>

            {productionOrders.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chưa có lệnh sản xuất nào sử dụng công thức này
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                        Mã Lệnh SX
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                        Ngày tạo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                        Số lượng SX
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {productionOrders.map((order: any) => (
                      <tr key={order.id}>
                        <td className="px-4 py-3">
                          <Link
                            href={`/production/orders/${order.id}`}
                            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {order.orderCode}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {order.plannedQuantity}{" "}
                          <span className="font-normal text-gray-500 dark:text-gray-400">
                            {order.finishedProduct?.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              order.status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                : order.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                                  : order.status === "cancelled"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                            }`}
                          >
                            {order.status === "completed"
                              ? "Hoàn thành"
                              : order.status === "in_progress"
                                ? "Đang làm"
                                : order.status === "cancelled"
                                  ? "Đã hủy"
                                  : "Chờ xử lý"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/production/orders/${order.id}`}
                            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                          >
                            Xem chi tiết
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Thống kê
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tổng NL</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {bom.materials?.length || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                  <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Hiệu suất</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {bom.efficiencyRate}%
                  </p>
                </div>
              </div>

              {bom.productionTime && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">T.gian SX</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {bom.productionTime} phút
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Thông tin khác
            </h3>

            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Người tạo
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {bom.creator?.fullName || "N/A"}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Ngày tạo
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {format(new Date(bom.createdAt), "dd/MM/yyyy HH:mm")}
                </dd>
              </div>

              {bom.approver && (
                <>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Người duyệt
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {bom.approver.fullName}
                    </dd>
                  </div>

                  {bom.approvedAt && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Ngày duyệt
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {format(new Date(bom.approvedAt), "dd/MM/yyyy HH:mm")}
                      </dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.action === "approve" ? confirmApprove : confirmDelete}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.action === "approve" ? "Phê duyệt" : "Xóa"}
        cancelText="Hủy"
        variant={confirmDialog.action === "delete" ? "danger" : "warning"}
        isLoading={confirmDialog.isLoading}
      />

      {/* Set Inactive Modal */}
      <CancelModal
        isOpen={inactiveModal.isOpen}
        onClose={() => setInactiveModal({ isOpen: false, isLoading: false })}
        onConfirm={confirmSetInactive}
        title="Ngừng sử dụng BOM"
        placeholder="Nhập lý do ngừng sử dụng BOM..."
        action="ngừng"
        message={`Vui lòng nhập lý do ngừng sử dụng BOM "${bom?.bomCode}":`}
        confirmText="Ngừng sử dụng"
        cancelText="Hủy"
        isLoading={inactiveModal.isLoading}
      />
    </div>
  );
}
