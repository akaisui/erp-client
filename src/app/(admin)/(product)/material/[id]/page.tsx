"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  useProduct,
  useDeleteProduct,
  useInventoryByProduct,
  useStockTransactions,
  useBOMsByProduct,
  useProductionOrders,
  useToggleProductStatus,
} from "@/hooks/api";
import { Can } from "@/components/auth";
import Badge from "@/components/ui/badge/Badge";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import { RestockModal, AdjustMinStockLevelModal } from "@/components/material";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Product, StockTransaction, Bom, ProductionOrder, SalesOrder, Promotion, Inventory, InventoryByProductResponse } from "@/types";
import { ArrowLeft, Boxes, DollarSign, Edit, FileText, Trash2, Zap, ShoppingCart, Settings, Sun } from "lucide-react";
import Button from "@/components/ui/button/Button";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params.id);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [isDiscontinueConfirmOpen, setIsDiscontinueConfirmOpen] = React.useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = React.useState(false);
  const [isAdjustMinStockOpen, setIsAdjustMinStockOpen] = React.useState(false);

  const { data: productWrapper, isLoading, error } = useProduct(productId);
  const product = productWrapper?.data as unknown as Product;
  const { data: inventoryWrapper, isLoading: inventoryLoading } = useInventoryByProduct(productId);
  const inventory = inventoryWrapper?.data as unknown as InventoryByProductResponse;

  const { data: transactionsWapper, isLoading: transactionsLoading } = useStockTransactions({
    productId: productId,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const transaction = transactionsWapper?.data as unknown as StockTransaction[];
  console.log(transaction);
  
  // BOM và Production Orders hooks - chỉ áp dụng cho thành phẩm
  const { data: bomWrapper, isLoading: bomLoading } = useBOMsByProduct(productId);
  const boms = bomWrapper?.data as unknown as Bom[];
  
  const { data: prodOrdersWrapper, isLoading: prodOrdersLoading } = useProductionOrders({
    finishedProductId: productId,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const productionOrders = prodOrdersWrapper?.data as unknown as ProductionOrder[];
  
  const deleteProduct = useDeleteProduct();
  const toggleStatus = useToggleProductStatus();

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteProduct.mutateAsync(productId);
      setIsDeleteConfirmOpen(false);
      router.push("/material");
    } catch (error) {
      console.error("Xóa nguyên liệu thất bại:", error);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleDiscontinueClick = () => {
    setIsDiscontinueConfirmOpen(true);
  };

  const handleConfirmDiscontinue = async () => {
    try {
      await toggleStatus.mutateAsync({
        id: productId,
        newStatus: "discontinued",
      });
      setIsDiscontinueConfirmOpen(false);
    } catch (error) {
      console.error("Ngừng kinh doanh sản phẩm thất bại:", error);
      setIsDiscontinueConfirmOpen(false);
    }
  };

  const getStatusBadgeColor = (status: string): "green" | "gray" | "red" => {
    const colors: Record<string, "green" | "gray" | "red"> = {
      active: "green",
      inactive: "gray",
      discontinued: "red",
    };
    return colors[status] || "gray";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: "Hoạt động",
      inactive: "Tạm ngưng",
      discontinued: "Ngừng kinh doanh",
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Đang tải...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/10">
        <p className="text-red-800 dark:text-red-200">
          Không tìm thấy sản phẩm này
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chi tiết nguyên liệu</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {product.productName} ({product.sku})
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Back Button */}
          <Button 
            onClick={() => router.back()} 
            size="smm"
            variant="outline"  
          >
            <ArrowLeft className="h-5 w-5" /> 
            Quay lại
          </Button>

          {/* Restock Button */}
          <Can permission="create_purchase_order">
            <button
              onClick={() => setIsRestockModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <ShoppingCart className="h-4 w-4" />
              Đặt mua
            </button>
          </Can>

          {/* Adjust Min Stock Level Button */}
          <button
            onClick={() => setIsAdjustMinStockOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <Settings className="h-4 w-4" />
            Định mức
          </button>

          {/* Edit Button */}
          <Can permission="update_product">
            <Link href={`/products/${productId}/edit`}>
              <button className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                <Edit className="h-4 w-4" />
                Chỉnh sửa
              </button>
            </Link>
          </Can>

          {/* Print Barcode Button */}
          <button
            onClick={() => {
              // Simple barcode print implementation
              const printWindow = window.open('', '', 'width=400,height=300');
              if (printWindow) {
                printWindow.document.write(`
                  <html>
                    <head>
                      <title>In mã vạch - ${product.productName}</title>
                      <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                        h3 { margin: 10px 0; }
                        svg { max-width: 300px; }
                      </style>
                    </head>
                    <body>
                      <h3>${product.productName}</h3>
                      <p>SKU: ${product.sku}</p>
                      <p>Mã vạch: ${product.barcode || 'N/A'}</p>
                      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
                      <svg id="barcode"><\/svg>
                      <script>
                        if('${product.barcode}') {
                          JsBarcode("#barcode", '${product.barcode}', { format: "CODE128" });
                        }
                        window.print();
                      <\/script>
                    </body>
                  </html>
                `);
                printWindow.document.close();
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            In mã vạch
          </button>

          {/* Deactivate Button */}
          {product.status !== 'discontinued' && (
            <button
              onClick={handleDiscontinueClick}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <Sun className="h-5 w-5" />
              Ngừng dùng
            </button>
          )}

          {/* Delete Button */}
          <Can permission="delete_product">
            <Button
              onClick={() => setIsDeleteConfirmOpen(true)}
              disabled={deleteProduct.isPending}
              variant="danger"
              size="ssmm"
            >
              <Trash2 className="h-4 w-4" />
              Xóa
            </Button>
          </Can>
        </div>
      </div>

      {/* Dashboard Summary Cards - 4 Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Stock Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tổng Tồn kho</p>
              <p className={`mt-2 text-2xl font-bold ${
                inventory && inventory.summary.totalQuantity <= (product.minStockLevel || 0)
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}>
                {inventoryLoading ? '...' : inventory?.summary.totalQuantity || 0}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Min: {product.minStockLevel || 0}
              </p>
            </div>
            <div className={`rounded-full p-3 ${
              inventory && inventory.summary.totalQuantity <= (product.minStockLevel || 0)
                ? 'bg-red-100 dark:bg-red-900/30'
                : 'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              <Boxes
                className={`h-6 w-6 ${
                    inventory && inventory.summary.totalQuantity <= (product.minStockLevel || 0)
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Last Purchase Price Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Giá vốn gần nhất</p>
              <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                {product.purchasePrice ? formatCurrency(product.purchasePrice) : 'N/A'}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Chi phí mua
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* On Order Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Đang đặt hàng</p>
              <p className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
                {inventoryLoading ? '...' : inventory?.summary.onOrderQuantity || 0}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Sắp nhập kho
              </p>
            </div>
            <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/30">
              <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Reserved Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Đang giữ cho SX</p>
              <p className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                {inventoryLoading ? '...' : inventory?.summary.totalReserved || 0}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Chờ lệnh SX
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
              <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Thông tin cơ bản
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Danh mục
                </dt>
                <dd className="mt-1 text-sm text-blue-500 dark:text-blue-500 hover:underline">
                    <Link href={`/danh-muc/${product.category?.id}`}>
                      {product.category?.categoryName || "-"}
                    </Link>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Nhà cung cấp
                </dt>
                <dd className="mt-1 text-sm text-blue-500 dark:text-blue-500 hover:underline">
                  <Link href={`/nha-cung-cap/${product.supplier?.id}`}>
                    {product.supplier?.supplierName || "-"}
                    </Link>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Đơn vị tính
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {product.unit}
                </dd>
              </div>

              {product.barcode && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Mã vạch
                  </dt>
                  <dd className="mt-1 font-mono text-sm text-gray-900 dark:text-white">
                    {product.barcode}
                  </dd>
                </div>
              )}

              {product.weight && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Trọng lượng
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product.weight} kg
                  </dd>
                </div>
              )}

              {product.dimensions && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Kích thước
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product.dimensions}
                  </dd>
                </div>
              )}
            </dl>

            {product.description && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Mô tả
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {product.description}
                </dd>
              </div>
            )}
          </div>

          {/* Pricing Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Thông tin giá
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              {product.purchasePrice && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Giá nhập
                  </dt>
                  <dd className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(product.purchasePrice)}
                  </dd>
                </div>
              )}

              {product.taxRate !== undefined && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Thuế suất
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product.taxRate}%
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Right Column - Meta Info */}
        <div className="space-y-6">
          {/* Stock Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Tồn kho
            </h2>
            <div className="mb-4 flex gap-2">
              <Badge color={getStatusBadgeColor(product.status)}>
                {getStatusLabel(product.status)}
              </Badge>
            </div>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tồn kho tối thiểu
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {product.minStockLevel || 0}
                </dd>
              </div>

              {product.expiryDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Hạn sử dụng
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatDate(product.expiryDate, "long")}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Metadata */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Thông tin hệ thống
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Ngày tạo
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(product.createdAt, "long")}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Cập nhật lần cuối
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(product.updatedAt, "long")}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      {product.images && product.images.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Hình ảnh sản phẩm
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {product.images
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((image, index) => (
                <div key={image.id} className="group relative aspect-square">
                  <Image
                    width={100}
                    height={100}
                    src={image.imageUrl}
                    alt={image.altText || `Product image ${index + 1}`}
                    className="h-full w-full rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                  {image.isPrimary && (
                    <div className="absolute left-2 top-2 rounded bg-yellow-500 px-2 py-1 text-xs font-medium text-white">
                      Chính
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                    {index + 1}/{product.images?.length}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Video Gallery */}
      {product.videos && product.videos.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Video sản phẩm
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {product.videos
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((video, index) => (
                <div key={video.id} className="group relative">
                  <div className="relative aspect-video rounded-lg border-2 border-gray-200 bg-black dark:border-gray-700 overflow-hidden">
                    {video.videoUrl?.includes('youtube.com') || video.videoUrl?.includes('youtu.be') ? (
                      // YouTube embed
                      <iframe
                        width="100%"
                        height="100%"
                        src={
                          video.videoUrl.includes('youtube.com')
                            ? video.videoUrl.replace('watch?v=', 'embed/')
                            : `https://www.youtube.com/embed/${video.videoUrl.split('/').pop()}`
                        }
                        title={video.title || `Product video ${index + 1}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    ) : (
                      // HTML5 video player
                      <video
                        width="100%"
                        height="100%"
                        controls
                        className="w-full h-full"
                      >
                        <source src={video.videoUrl} />
                        Trình duyệt của bạn không hỗ trợ video HTML5.
                      </video>
                    )}
                  </div>
                  {video.title && (
                    <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      {video.title}
                    </p>
                  )}
                  {video.description && (
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                  <div className="absolute top-2 right-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                    {index + 1}/{product.videos?.length}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* BOM Section */}
      {product.productType === 'finished_product' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Công thức sản xuất (BOM)
            </h2>
            <Link
              href={`/production/bom?product=${productId}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Quản lý →
            </Link>
          </div>

          {bomLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            </div>
          ) : boms && boms.length > 0 ? (
            <div className="space-y-3">
              {boms.map((bom) => (
                <div key={bom.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {bom.bomCode}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Phiên bản: {bom.version}
                      </p>
                    </div>
                    <Badge
                      color={
                        bom.status === 'active'
                          ? 'green'
                          : bom.status === 'draft'
                          ? 'yellow'
                          : 'gray'
                      }
                    >
                      {bom.status === 'active'
                        ? 'Đang dùng'
                        : bom.status === 'draft'
                        ? 'Nháp'
                        : 'Không dùng'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Sản lượng/mẻ:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {bom.outputQuantity}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Hiệu suất:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {bom.efficiencyRate || 100}%
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Thời gian:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {bom.productionTime || '-'} phút
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Nguyên liệu:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {bom.materials?.length || 0} mục
                      </p>
                    </div>
                  </div>

                  {bom.materials && bom.materials.length > 0 && (
                    <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                      <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                        Chi tiết nguyên liệu:
                      </p>
                      <div className="grid gap-1 text-xs">
                        {bom.materials.slice(0, 3).map((material) => (
                          <div key={material.id} className="flex justify-between text-gray-700 dark:text-gray-300">
                            <span>{material.material?.productName || 'N/A'}</span>
                            <span className="text-gray-600 dark:text-gray-400">
                              {material.quantity} {material.unit}
                            </span>
                          </div>
                        ))}
                        {bom.materials.length > 3 && (
                          <p className="text-gray-600 dark:text-gray-400">
                            +{bom.materials.length - 3} mục khác
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/production/bom/${bom.id}`}
                    className="mt-3 inline-block text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Chi tiết →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
              Chưa có công thức sản xuất. 
              <Link
                href={`/production/bom/create?product=${productId}`}
                className="ml-2 font-medium hover:underline"
              >
                Tạo mới →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Inventory by Warehouse */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tồn kho theo kho
          </h2>
          <Link
            href={`/inventory?product=${productId}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Xem tất cả →
          </Link>
        </div>
        <InventoryTable
          inventory={inventory}
          isLoading={inventoryLoading}
          showWarehouse={true}
          onTransfer={(item) => {
            router.push(`/stock-transfer/create?from=${item.warehouseId}&product=${productId}`);
          }}
        />
      </div>

      {/* Transaction History */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Lịch sử giao dịch
          </h2>
          <Link
            href={`/inventory/transactions?product=${productId}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Xem tất cả →
          </Link>
        </div>

        {transactionsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : transaction && transaction.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Mã giao dịch
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Loại
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Kho
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Số lượng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Ngày tạo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {transaction.map((transaction) => {
                  // Find the detail for this product
                  const detail = transaction.details?.find(d => d.productId === productId);
                  const quantity = detail?.quantity || 0;

                  const getTypeLabel = (type: string) => {
                    const labels: Record<string, string> = {
                      import: "Nhập kho",
                      export: "Xuất kho",
                      transfer: "Chuyển kho",
                      disposal: "Hủy hàng",
                      stocktake: "Kiểm kê",
                    };
                    return labels[type] || type;
                  };

                  const getStatusInfo = (status: string): { label: string; color: "gray" | "yellow" | "blue" | "green" | "red" } => {
                    const info: Record<string, { label: string; color: "gray" | "yellow" | "blue" | "green" | "red" }> = {
                      draft: { label: "Nháp", color: "gray" },
                      pending: { label: "Chờ duyệt", color: "yellow" },
                      approved: { label: "Đã duyệt", color: "blue" },
                      completed: { label: "Hoàn thành", color: "green" },
                      cancelled: { label: "Đã hủy", color: "red" },
                    };
                    return info[status] || { label: status, color: "gray" };
                  };

                  const statusInfo = getStatusInfo(transaction.status);

                  return (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        <Link
                          href={`/inventory/transactions/${transaction.id}`}
                          className="hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {transaction.transactionCode}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {getTypeLabel(transaction.transactionType)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {transaction.warehouse?.warehouseName || transaction.sourceWarehouse?.warehouseName || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                        {quantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge color={statusInfo.color}>{statusInfo.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Chưa có giao dịch nào
            </p>
          </div>
        )}
      </div>

      {/* BOM Usage Section - Raw Material Usage */}
      {product.productType === 'raw_material' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
            Định mức & Sử dụng
          </h2>

          {/* Part 1: Used in BOMs */}
          <div className="mb-8">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              Trong công thức (Used in BOMs)
            </h3>
            
            {bomLoading ? (
              <div className="flex h-24 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-gray-300 border-t-blue-600"></div>
              </div>
            ) : boms && boms.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Thành phẩm
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Định mức/đơn vị TP
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Trạng thái BOM
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {boms.map((bom) => {
                      const rawMaterial = bom.materials?.find(m => m.materialId === productId);
                      return (
                        <tr key={bom.id}>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {bom.finishedProduct?.productName || 'N/A'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {bom.finishedProduct?.sku}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {rawMaterial?.quantity || 0} {rawMaterial?.unit || product.unit}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              color={
                                bom.status === 'active'
                                  ? 'green'
                                  : bom.status === 'draft'
                                  ? 'yellow'
                                  : 'gray'
                              }
                            >
                              {bom.status === 'active'
                                ? 'Đang dùng'
                                : bom.status === 'draft'
                                ? 'Nháp'
                                : 'Không dùng'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/production/bom/${bom.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Chi tiết →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                Nguyên liệu này chưa được sử dụng trong công thức nào.
              </div>
            )}
          </div>

          {/* Part 2: Production History */}
          <div className="border-t border-gray-200 pt-8 dark:border-gray-700">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
              Lịch sử sử dụng trong SX
            </h3>

            {prodOrdersLoading ? (
              <div className="flex h-24 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-gray-300 border-t-blue-600"></div>
              </div>
            ) : productionOrders && productionOrders.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Mã lệnh SX
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Định mức
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Thực tế
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Hao hụt
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Trạng thái
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {productionOrders.map((order) => {
                      const plannedQty = order.plannedQuantity || 0;
                      const actualQty = order.actualQuantity || 0;
                      const waste = plannedQty - actualQty;
                      const wastePercent = plannedQty > 0 ? ((waste / plannedQty) * 100).toFixed(1) : 0;

                      return (
                        <tr key={order.id}>
                          <td className="px-4 py-3">
                            <Link
                              href={`/production-orders/${order.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {order.orderCode}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-900 dark:text-white">
                              {plannedQty} {product.unit}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {actualQty} {product.unit}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className={`text-sm font-semibold ${
                              waste > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                            }`}>
                              {waste} ({wastePercent}%)
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              color={
                                order.status === 'completed'
                                  ? 'green'
                                  : order.status === 'in_progress'
                                  ? 'blue'
                                  : 'gray'
                              }
                            >
                              {order.status === 'completed'
                                ? 'Hoàn thành'
                                : order.status === 'in_progress'
                                ? 'Đang SX'
                                : 'Khác'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                Chưa có lịch sử sử dụng nguyên liệu này trong sản xuất.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Production History */}
      {product.productType === 'finished_product' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Lịch sử sản xuất
            </h2>
            <Link
              href={`/production-orders?product=${productId}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Xem tất cả →
            </Link>
          </div>

          {prodOrdersLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            </div>
          ) : productionOrders && productionOrders.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Mã lệnh
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Dự kiến
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Thực tế
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Ngày bắt đầu
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {productionOrders.map((order) => {
                    const getStatusInfo = (status: string): { label: string; color: "gray" | "yellow" | "blue" | "green" | "red" } => {
                      const info: Record<string, { label: string; color: "gray" | "yellow" | "blue" | "green" | "red" }> = {
                        pending: { label: "Chờ", color: "yellow" },
                        in_progress: { label: "Đang sản xuất", color: "blue" },
                        completed: { label: "Hoàn thành", color: "green" },
                        cancelled: { label: "Hủy", color: "red" },
                      };
                      return info[status] || { label: status, color: "gray" };
                    };

                    const statusInfo = getStatusInfo(order.status);
                    const variance = order.actualQuantity - order.plannedQuantity;
                    const varianceColor = variance > 0 ? 'text-green-600 dark:text-green-400' : variance < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400';

                    return (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          <Link href={`/production-orders/${order.id}`} className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                            {order.orderCode}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {order.plannedQuantity.toLocaleString()}
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium ${varianceColor}`}>
                          {order.actualQuantity.toLocaleString()}
                          {variance !== 0 && (
                            <span className="text-xs">
                              {' '}({variance > 0 ? '+' : ''}{variance})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge color={statusInfo.color}>{statusInfo.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(order.startDate, "short")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Chưa có lệnh sản xuất nào
              </p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa sản phẩm"
        message={`Bạn có chắc chắn muốn xóa sản phẩm "${product?.productName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteProduct.isPending}
      />

      {/* Discontinue Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isDiscontinueConfirmOpen}
          onClose={() => setIsDiscontinueConfirmOpen(false)}
          onConfirm={handleConfirmDiscontinue}
          title="Ngừng kinh doanh"
          message={`Bạn có chắc chắn muốn ngừng kinh doanh sản phẩm "${product?.productName}"? Sản phẩm sẽ không còn được sử dụng trong hệ thống.`}
          confirmText="Ngừng"
          cancelText="Hủy"
          variant="warning"
          isLoading={toggleStatus.isPending}
        />

      {/* Restock Modal */}
      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        product={product}
      />

      {/* Adjust Min Stock Level Modal */}
      <AdjustMinStockLevelModal
        isOpen={isAdjustMinStockOpen}
        onClose={() => setIsAdjustMinStockOpen(false)}
        product={product}
        onSuccess={() => {
          // Refresh product data if needed
        }}
      />
    </div>
  );
}