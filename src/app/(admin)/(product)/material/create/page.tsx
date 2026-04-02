"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateProduct, useCategories, useSuppliers, useUploadProductImages, useUploadProductVideos } from "@/hooks/api";
import { productSchema, type ProductFormData } from "@/lib/validations/product.schema";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/SelectField";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { FormDatePicker } from "@/components/form/FormDatePicker";
import { ArrowLeft, Image as ImageIcon, Save, Video as VideoIcon } from "lucide-react";
import { Category, Product, Supplier } from "@/types";

export default function CreateProductPage() {
  const router = useRouter();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [savingMedia, setSavingMedia] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | undefined>();
  
  const createProduct = useCreateProduct();
  const uploadImages = useUploadProductImages();
  const uploadVideos = useUploadProductVideos();
  const { data: categoriesResponse } = useCategories({ status: "active" });
  const { data: suppliersResponse } = useSuppliers({ status: "active" });

  const categories = (categoriesResponse?.data as unknown as Category[]) || [];
  const suppliers = (suppliersResponse?.data as unknown as Supplier[]) || [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productType: "raw_material",
      status: "active",
      taxRate: 0,
      minStockLevel: 0,
    },
  });

  const productType = watch("productType");

  const onSubmit = async (data: ProductFormData) => {
    try {
      setSavingMedia(true);
      
      // Bước 1: Tạo sản phẩm trước
      const result = await createProduct.mutateAsync(data) as unknown as Product;
      const productId = result.id;
      
      // Bước 2: Upload hình ảnh nếu có
      if (imageFiles.length > 0) {
        await uploadImages.mutateAsync({
          productId,
          files: imageFiles,
        });
      }
      
      // Bước 3: Upload video nếu có
      if (videoFile) {
        await uploadVideos.mutateAsync({
          productId,
          files: [videoFile],
        });
      }

      // Bước 4: Redirect to detail page
      router.push(`/material/${productId}`);
    } catch (error) {
      console.error("Tạo sản phẩm thất bại:", error);
    } finally {
      setSavingMedia(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Thêm nguyên liệu mới
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Nhập thông tin nguyên liệu để quản lý tồn kho
          </p>
        </div>

        <Button variant="outline" size="ssm" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </Button>
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

            {/* Product Name */}
            <div>
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
              <Label>Danh mục</Label>
              <SearchableSelect
                options={[
                  { value: "", label: "-- Chọn danh mục --" },
                  ...categories.map((category) => ({
                    value: category.id,
                    label: category.categoryName,
                  })),
                ]}
                value={selectedCategoryId || ""}
                onChange={(value) => {
                  const numValue = value === "" || !value ? undefined : Number(value);
                  setSelectedCategoryId(numValue);
                  setValue("categoryId", numValue);
                }}
                placeholder="Tìm danh mục..."
                isClearable={false}
              />
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
              )}
            </div>

            {/* Supplier */}
            <div>
              <Label>Nhà cung cấp</Label>
              <SearchableSelect
                options={[
                  { value: "", label: "-- Chọn nhà cung cấp --" },
                  ...suppliers.map((supplier) => ({
                    value: supplier.id,
                    label: supplier.supplierName,
                  })),
                ]}
                value={selectedSupplierId || ""}
                onChange={(value) => {
                  const numValue = value === "" || !value ? undefined : Number(value);
                  setSelectedSupplierId(numValue);
                  setValue("supplierId", numValue);
                }}
                placeholder="Tìm nhà cung cấp..."
                isClearable={false}
              />
              {errors.supplierId && (
                <p className="mt-1 text-sm text-red-600">{errors.supplierId.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Media Upload Section - Always visible */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
            Hình ảnh & Video (Tùy chọn)
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
            {/* Images Section */}
            <div>
                <div className="mb-3 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                    Hình ảnh (Tối đa 5)
                </h3>
                </div>
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => !imageFiles.length && document.getElementById('image-input')?.click()}>
              {imageFiles.length === 0 ? (
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 pointer-events-none">
                    📁 Drag & drop ảnh tại đây hoặc click để chọn
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {imageFiles.map((file, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`preview-${idx}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFiles(imageFiles.filter((_, i) => i !== idx));
                        }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <div
                    onClick={() => document.getElementById('image-input')?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg h-32 flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <span className="text-2xl">➕</span>
                  </div>
                </div>
              )}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    setImageFiles([...imageFiles, ...Array.from(e.target.files)]);
                  }
                }}
                className="hidden"
                id="image-input"
              />
            </div>
            </div>

            {/* Videos Section */}
            <div>
                <div className="mb-3 flex items-center gap-2">
                <VideoIcon className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                    Video (Tối đa 1)
                </h3>
                </div>
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => !videoFile && document.getElementById('video-input')?.click()}>
                  {!videoFile ? (
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 pointer-events-none">
                        🎬 Drag & drop video tại đây hoặc click để chọn
                      </p>
                    </div>
                  ) : (
                    <div className="relative group">
                      <video
                        src={URL.createObjectURL(videoFile)}
                        controls
                        className="w-full h-48 bg-black rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoFile(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div
                        onClick={() => document.getElementById('video-input')?.click()}
                        className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded text-center cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50"
                      >
                        <span className="text-xs text-blue-700 dark:text-blue-300">Thay đổi video</span>
                      </div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setVideoFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="video-input"
                  />
                </div>
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
              <FormDatePicker
                name="expiryDate"
                control={control}
                label="Hạn sử dụng"
                placeholder="Chọn ngày hết hạn"
                dateFormat="Y-m-d"
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
            size="sm"
            variant="primary"
            isLoading={savingMedia}
            disabled={savingMedia}
          >
            <Save className="h-4 w-4" />
            {savingMedia ? "Đang lưu..." : "Tạo mới"}
          </Button>
        </div>
      </form>
    </div>
  );
}