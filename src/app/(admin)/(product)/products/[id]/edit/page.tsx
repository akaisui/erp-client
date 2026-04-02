"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProduct, useUpdateProduct, useCategories, useSuppliers } from "@/hooks/api";
import { productSchema, type ProductFormData } from "@/lib/validations/product.schema";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/SelectField";
import { ProductImageManager } from "@/components/products";
import { Category, Product, Supplier } from "@/types";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);

  const { data: dataWrapper, isLoading, error } = useProduct(productId);
  const product = dataWrapper?.data as unknown as Product;
  console.log(product);
  const updateProduct = useUpdateProduct();
  const { data: categoriesResponse } = useCategories({ status: "active" });
  const { data: suppliersResponse } = useSuppliers({ status: "active" });

  const categories = categoriesResponse?.data as unknown as Category[] || [];
  const suppliers = suppliersResponse?.data as unknown as Supplier[] || [];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
  });

  const productType = watch("productType");

  // Reset form when product data is loaded
  useEffect(() => {
    if (product) {
      reset({
        sku: product.sku,
        productName: product.productName,
        productType: product.productType,
        packagingType: product.packagingType,
        categoryId: product.categoryId || undefined,
        supplierId: product.supplierId || undefined,
        unit: product.unit,
        barcode: product.barcode || undefined,
        weight: product.weight || undefined,
        dimensions: product.dimensions || undefined,
        description: product.description || undefined,
        purchasePrice: product.purchasePrice || undefined,
        sellingPriceRetail: product.sellingPriceRetail || undefined,
        sellingPriceWholesale: product.sellingPriceWholesale || undefined,
        sellingPriceVip: product.sellingPriceVip || undefined,
        taxRate: product.taxRate || 0,
        minStockLevel: product.minStockLevel || 0,
        expiryDate: product.expiryDate?.split("T")[0] || undefined,
        status: product.status,
      });
    }
  }, [product, reset]);

  const onSubmit = async (data: ProductFormData) => {
    try {
      await updateProduct.mutateAsync({ id: productId, data });
      router.push(`/products/${productId}`);
    } catch (error) {
      console.error("Update product error:", error);
    }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chỉnh sửa sản phẩm
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Cập nhật thông tin sản phẩm: {product.productName}
          </p>
        </div>
      </div>

      {/* Form - Same as create page */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Thông tin cơ bản */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Thông tin cơ bản
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                type="text"
                {...register("sku")}
                error={errors.sku?.message}
                disabled
              />
            </div>

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

            <div className="md:col-span-2">
              <Label htmlFor="productName">
                Tên sản phẩm <span className="text-red-500">*</span>
              </Label>
              <Input
                id="productName"
                type="text"
                {...register("productName")}
                error={errors.productName?.message}
              />
            </div>

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

            <div>
              <Label htmlFor="unit">
                Đơn vị tính <span className="text-red-500">*</span>
              </Label>
              <Input
                id="unit"
                type="text"
                {...register("unit")}
                error={errors.unit?.message}
              />
            </div>

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
            <div>
              <Label htmlFor="barcode">Mã vạch (Barcode)</Label>
              <Input
                id="barcode"
                type="text"
                {...register("barcode")}
                error={errors.barcode?.message}
              />
            </div>

            <div>
              <Label htmlFor="weight">Trọng lượng (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                {...register("weight", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
                error={errors.weight?.message}
              />
            </div>

            <div>
              <Label htmlFor="dimensions">Kích thước</Label>
              <Input
                id="dimensions"
                type="text"
                {...register("dimensions")}
                error={errors.dimensions?.message}
              />
            </div>

            <div>
              <Label htmlFor="expiryDate">Hạn sử dụng</Label>
              <Input
                id="expiryDate"
                type="date"
                {...register("expiryDate")}
                error={errors.expiryDate?.message}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Mô tả</Label>
              <textarea
                id="description"
                rows={3}
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
            <div>
              <Label htmlFor="purchasePrice">Giá nhập (VNĐ)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="1000"
                {...register("purchasePrice", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
                error={errors.purchasePrice?.message}
              />
            </div>

            <div>
              <Label htmlFor="sellingPriceRetail">Giá bán lẻ (VNĐ)</Label>
              <Input
                id="sellingPriceRetail"
                type="number"
                step="1000"
                {...register("sellingPriceRetail", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
                error={errors.sellingPriceRetail?.message}
              />
            </div>

            <div>
              <Label htmlFor="sellingPriceWholesale">Giá bán sỉ (VNĐ)</Label>
              <Input
                id="sellingPriceWholesale"
                type="number"
                step="1000"
                {...register("sellingPriceWholesale", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
                error={errors.sellingPriceWholesale?.message}
              />
            </div>

            <div>
              <Label htmlFor="sellingPriceVip">Giá VIP (VNĐ)</Label>
              <Input
                id="sellingPriceVip"
                type="number"
                step="1000"
                {...register("sellingPriceVip", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
                error={errors.sellingPriceVip?.message}
              />
            </div>

            <div>
              <Label htmlFor="taxRate">Thuế suất (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                {...register("taxRate", {
                  setValueAs: (v) => (v === "" ? 0 : Number(v)),
                })}
                error={errors.taxRate?.message}
              />
            </div>

            <div>
              <Label htmlFor="minStockLevel">Tồn kho tối thiểu</Label>
              <Input
                id="minStockLevel"
                type="number"
                min="0"
                {...register("minStockLevel", {
                  setValueAs: (v) => (v === "" ? 0 : Number(v)),
                })}
                error={errors.minStockLevel?.message}
              />
            </div>

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

        {/* Images */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <ProductImageManager
            productId={productId}
            images={product.images || []}
            maxImages={5}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={updateProduct.isPending}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={updateProduct.isPending}
            disabled={updateProduct.isPending}
          >
            {updateProduct.isPending ? "Đang cập nhật..." : "Cập nhật sản phẩm"}
          </Button>
        </div>
      </form>
    </div>
  );
}
