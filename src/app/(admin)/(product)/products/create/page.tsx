"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateProduct, useCategories, useSuppliers } from "@/hooks/api";
import { productSchema, type ProductFormData } from "@/lib/validations/product.schema";
import { ProductImageManager, type ProductImageManagerRef } from "@/components/products";
import { ProductVideoManager, type ProductVideoManagerRef } from "@/components/products";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/SelectField";
import { Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { Category, Product, Supplier } from "@/types";

export default function CreateProductPage() {
  const router = useRouter();
  const [createdProductId, setCreatedProductId] = useState<number | null>(null);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [savingMedia, setSavingMedia] = useState(false);
  const imageManagerRef = React.useRef<ProductImageManagerRef>(null);
  const videoManagerRef = React.useRef<ProductVideoManagerRef>(null);
  
  const createProduct = useCreateProduct();
  const { data: categoriesResponse } = useCategories({ status: "active" });
  const { data: suppliersResponse } = useSuppliers({ status: "active" });

  const categories = (categoriesResponse?.data as unknown as Category[]) || [];
  const suppliers = (suppliersResponse?.data as unknown as Supplier[]) || [];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      status: "active",
      taxRate: 0,
      minStockLevel: 0,
    },
  });

  const productType = watch("productType");

  const onSubmit = async (data: ProductFormData) => {
    try {
      const result = await createProduct.mutateAsync(data) as unknown as Product;

      setCreatedProductId(result.id);
      setShowMediaUpload(true);
    } catch (error) {
      console.error("Create product error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Thêm sản phẩm mới
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Nhập thông tin sản phẩm, nguyên liệu hoặc hàng hóa
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Thông tin cơ bản */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Thông tin cơ bản
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {/* SKU */}
            <div>
              <Label htmlFor="sku">
                SKU <span className="text-xs text-gray-500">(Tự động nếu để trống)</span>
              </Label>
              <Input
                id="sku"
                type="text"
                placeholder="VD: NL-0001"
                {...register("sku")}
                error={errors.sku?.message}
              />
            </div>

            {/* Product Type */}
            <div>
              <Label htmlFor="productType">
                Loại sản phẩm <span className="text-red-500">*</span>
              </Label>
              <Select
                id="productType"
                {...register("productType")}
                error={errors.productType?.message}
              >
                <option value="">-- Chọn loại --</option>
                <option value="raw_material">Nguyên liệu</option>
                <option value="packaging">Bao bì</option>
                <option value="finished_product">Thành phẩm</option>
                <option value="goods">Hàng hóa</option>
              </Select>
            </div>

            {/* Product Name */}
            <div className="md:col-span-2">
              <Label htmlFor="productName">
                Tên sản phẩm <span className="text-red-500">*</span>
              </Label>
              <Input
                id="productName"
                type="text"
                placeholder="Nhập tên sản phẩm"
                {...register("productName")}
                error={errors.productName?.message}
              />
            </div>

            {/* Packaging Type - Only show if type is packaging */}
            {productType === "packaging" && (
              <div>
                <Label htmlFor="packagingType">
                  Loại bao bì <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="packagingType"
                  {...register("packagingType")}
                  error={errors.packagingType?.message}
                >
                  <option value="">-- Chọn loại bao bì --</option>
                  <option value="bottle">Chai/Lọ</option>
                  <option value="box">Hộp/Thùng</option>
                  <option value="bag">Túi/Bao</option>
                  <option value="label">Nhãn</option>
                  <option value="other">Khác</option>
                </Select>
              </div>
            )}

            {/* Unit */}
            <div>
              <Label htmlFor="unit">
                Đơn vị tính <span className="text-red-500">*</span>
              </Label>
              <Input
                id="unit"
                type="text"
                placeholder="VD: kg, lít, cái, hộp..."
                {...register("unit")}
                error={errors.unit?.message}
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="categoryId">Danh mục</Label>
              <Select
                id="categoryId"
                {...register("categoryId", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
                error={errors.categoryId?.message}
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.categoryName}
                  </option>
                ))}
              </Select>
            </div>

            {/* Supplier */}
            <div>
              <Label htmlFor="supplierId">Nhà cung cấp</Label>
              <Select
                id="supplierId"
                {...register("supplierId", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
                error={errors.supplierId?.message}
              >
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.supplierName}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Thông tin chi tiết
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Barcode */}
            <div>
              <Label htmlFor="barcode">Mã vạch (Barcode)</Label>
              <Input
                id="barcode"
                type="text"
                placeholder="Nhập mã vạch"
                {...register("barcode")}
                error={errors.barcode?.message}
              />
            </div>

            {/* Weight */}
            <div>
              <Label htmlFor="weight">Trọng lượng (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("weight", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
                error={errors.weight?.message}
              />
            </div>

            {/* Dimensions */}
            <div>
              <Label htmlFor="dimensions">Kích thước</Label>
              <Input
                id="dimensions"
                type="text"
                placeholder="VD: 20x30x40 cm"
                {...register("dimensions")}
                error={errors.dimensions?.message}
              />
            </div>

            {/* Expiry Date */}
            <div>
              <Label htmlFor="expiryDate">Hạn sử dụng</Label>
              <Input
                id="expiryDate"
                type="date"
                {...register("expiryDate")}
                error={errors.expiryDate?.message}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Label htmlFor="description">Mô tả</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Nhập mô tả sản phẩm..."
                {...register("description")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Giá & Tồn kho */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Giá & Tồn kho
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Purchase Price */}
            <div>
              <Label htmlFor="purchasePrice">Giá nhập (VNĐ)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="1000"
                placeholder="0"
                {...register("purchasePrice", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
                error={errors.purchasePrice?.message}
              />
            </div>

            {/* Selling Price Retail */}
            <div>
              <Label htmlFor="sellingPriceRetail">Giá bán lẻ (VNĐ)</Label>
              <Input
                id="sellingPriceRetail"
                type="number"
                step="1000"
                placeholder="0"
                {...register("sellingPriceRetail", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
                error={errors.sellingPriceRetail?.message}
              />
            </div>

            {/* Selling Price Wholesale */}
            <div>
              <Label htmlFor="sellingPriceWholesale">Giá bán sỉ (VNĐ)</Label>
              <Input
                id="sellingPriceWholesale"
                type="number"
                step="1000"
                placeholder="0"
                {...register("sellingPriceWholesale", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
                error={errors.sellingPriceWholesale?.message}
              />
            </div>

            {/* Selling Price VIP */}
            <div>
              <Label htmlFor="sellingPriceVip">Giá VIP (VNĐ)</Label>
              <Input
                id="sellingPriceVip"
                type="number"
                step="1000"
                placeholder="0"
                {...register("sellingPriceVip", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
                error={errors.sellingPriceVip?.message}
              />
            </div>

            {/* Tax Rate */}
            <div>
              <Label htmlFor="taxRate">Thuế suất (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="0"
                {...register("taxRate", {
                  setValueAs: (v) => (v === "" ? 0 : Number(v)),
                })}
                error={errors.taxRate?.message}
              />
            </div>

            {/* Min Stock Level */}
            <div>
              <Label htmlFor="minStockLevel">Tồn kho tối thiểu</Label>
              <Input
                id="minStockLevel"
                type="number"
                min="0"
                placeholder="0"
                {...register("minStockLevel", {
                  setValueAs: (v) => (v === "" ? 0 : Number(v)),
                })}
                error={errors.minStockLevel?.message}
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <Select id="status" {...register("status")} error={errors.status?.message}>
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm ngưng</option>
                <option value="discontinued">Ngừng kinh doanh</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={createProduct.isPending}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createProduct.isPending}
            disabled={createProduct.isPending}
          >
            {createProduct.isPending ? "Đang tạo..." : "Tạo sản phẩm"}
          </Button>
        </div>
      </form>

      {/* Media Upload Modal - Shown after product created */}
      {showMediaUpload && createdProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Thêm hình ảnh & video
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Tải lên hình ảnh và video để hiển thị sản phẩm (tùy chọn)
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Images Section */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Hình ảnh
                  </h3>
                </div>
                <ProductImageManager
                  ref={imageManagerRef}
                  productId={createdProductId!}
                  images={[]}
                  maxImages={5}
                  hidePreview={false}
                  hideSaveButton={true}
                  onImagesChange={setImageFiles}
                  className="bg-white dark:bg-gray-900"
                />
              </div>

              {/* Videos Section */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <VideoIcon className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Video (Tối đa 1)
                  </h3>
                </div>
                <ProductVideoManager
                  ref={videoManagerRef}
                  productId={createdProductId!}
                  video={undefined}
                  onVideoChange={setVideoFile}
                  className="bg-white dark:bg-gray-900"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowMediaUpload(false);
                  setCreatedProductId(null);
                  setVideoFile(null);
                  setImageFiles([]);
                  router.push("/products");
                }}
              >
                Bỏ qua
              </Button>
              <Button
                type="button"
                variant="primary"
                isLoading={savingMedia}
                onClick={async () => {
                  try {
                    setSavingMedia(true);

                    // Save images if there are any
                    if (imageManagerRef.current && imageManagerRef.current.hasUnsavedImages()) {
                      await imageManagerRef.current.saveImages();
                    }

                    // Save video if there is any
                    if (videoManagerRef.current && videoManagerRef.current.hasUnsavedVideo()) {
                      await videoManagerRef.current.saveVideo();
                    }

                    setShowMediaUpload(false);
                    setCreatedProductId(null);
                    setVideoFile(null);
                    setImageFiles([]);
                    router.push(`/products/${createdProductId}`);
                  } catch (error) {
                    console.error("Save media error:", error);
                  } finally {
                    setSavingMedia(false);
                  }
                }}
              >
                {savingMedia ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}