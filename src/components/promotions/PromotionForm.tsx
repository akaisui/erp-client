"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type {
  CreatePromotionDto,
  PromotionType,
  ApplicableTo,
  PromotionConditions,
  Product,
} from "@/types";
import { useProducts } from "@/hooks/api";
import Button from "@/components/ui/button/Button";
import {
  Calendar,
  FileText,
  Percent,
  DollarSign,
  Gift,
  Tag,
  Plus,
  Trash2,
  Settings,
  X,
} from "lucide-react";
import { FormDatePicker } from "@/components/form/FormDatePicker";
import { format } from "date-fns";
import { CreatePromotionFormData, createPromotionSchema } from "@/lib/validations";

interface PromotionFormProps {
  initialData?: Partial<CreatePromotionDto>;
  onSubmit: (data: CreatePromotionDto) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export default function PromotionForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: PromotionFormProps) {
  const [showConditionsBuilder, setShowConditionsBuilder] = useState(false);
  const [conditions, setConditions] = useState<PromotionConditions>(
    initialData?.conditions || {}
  );

  const { data: productsData } = useProducts({
    status: "active",
    productType: ["finished_product", "goods"],
    limit: 1000
  });
  const products = productsData?.data as unknown as Product[];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreatePromotionFormData>({
    resolver: zodResolver(createPromotionSchema),
    shouldUnregister: true,
    defaultValues: {
      promotionCode: initialData?.promotionCode || "",
      promotionName: initialData?.promotionName || "",
      promotionType: initialData?.promotionType || "percent_discount",
      discountValue: initialData?.discountValue || 0,
      maxDiscountValue: initialData?.maxDiscountValue,
      startDate: initialData?.startDate || format(new Date(), "yyyy-MM-dd"),
      endDate: initialData?.endDate || format(new Date(), "yyyy-MM-dd"),
      isRecurring: initialData?.isRecurring || false,
      applicableTo: initialData?.applicableTo || "all",
      minOrderValue: initialData?.minOrderValue || 0,
      minQuantity: initialData?.minQuantity || 0,
      quantityLimit: initialData?.quantityLimit,
      products: initialData?.products || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "products",
  });

  const promotionType = watch("promotionType");
  const applicableTo = watch("applicableTo");
  const discountValue = watch("discountValue");

  const handleFormSubmit = async (data: CreatePromotionFormData) => {
    console.log("CON CÓC QUÝ", data)
    const submitData: CreatePromotionDto = {
      ...data,
      conditions: showConditionsBuilder ? conditions : undefined,
    };
    await onSubmit(submitData);
  };

  const handleClick = async (data: any) => {
    console.log()
  }

  const getPromotionTypeIcon = (type: PromotionType) => {
    const icons = {
      percent_discount: <Percent className="h-5 w-5" />,
      fixed_discount: <DollarSign className="h-5 w-5" />,
      buy_x_get_y: <Gift className="h-5 w-5" />,
      gift: <Tag className="h-5 w-5" />,
    };
    return icons[type];
  };
  return (
    <form onSubmit={handleSubmit(
      handleFormSubmit,
      (errors) => {
        console.log("❌ VALIDATION ERRORS", errors);
      }
    )} className="space-y-6">
      {/* Promotion Type Selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Loại khuyến mãi <span className="text-red-500">*</span>
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              "percent_discount",
              "fixed_discount",
              "buy_x_get_y",
              "gift",
            ] as PromotionType[]
          ).map((type) => (
            <label
              key={type}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-colors ${promotionType === type
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 hover:border-gray-400 dark:border-gray-600"
                }`}
            >
              <input
                type="radio"
                value={type}
                {...register("promotionType")}
                className="h-4 w-4 text-blue-600"
              />
              <div className="flex items-center gap-2">
                {getPromotionTypeIcon(type)}
                <span className="text-sm font-medium">
                  {type === "percent_discount" && "Giảm %"}
                  {type === "fixed_discount" && "Giảm cố định"}
                  {type === "buy_x_get_y" && "Mua X tặng Y"}
                  {type === "gift" && "Tặng quà"}
                </span>
              </div>
            </label>
          ))}
        </div>
        {errors.promotionType && (
          <p className="mt-1 text-sm text-red-600">
            {errors.promotionType.message}
          </p>
        )}
      </div>

      {/* Basic Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Mã khuyến mãi <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("promotionCode")}
            placeholder="VD: KM-TET-2025"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          {errors.promotionCode && (
            <p className="mt-1 text-sm text-red-600">
              {errors.promotionCode.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tên khuyến mãi <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register("promotionName")}
            placeholder="VD: Tết giảm giá 20%"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          {errors.promotionName && (
            <p className="mt-1 text-sm text-red-600">
              {errors.promotionName.message}
            </p>
          )}
        </div>
      </div>

      {/* Discount Value */}
      <div className="grid gap-4 sm:grid-cols-2">
        {promotionType !== "buy_x_get_y" && promotionType !== "gift" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Giá trị giảm <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                {...register("discountValue", { valueAsNumber: true })}
                placeholder={promotionType === "percent_discount" ? "20" : "100000"}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                {promotionType === "percent_discount" ? "%" : "đ"}
              </span>
            </div>
            {errors.discountValue && (
              <p className="mt-1 text-sm text-red-600">
                {errors.discountValue.message}
              </p>
            )}
          </div>

        )}

        {promotionType === "percent_discount" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Giảm tối đa
            </label>
            <div className="relative">
              <input
                type="number"
                step="1000"
                {...register("maxDiscountValue", { valueAsNumber: true })}
                placeholder="500000"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                đ
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Để tránh giảm quá nhiều cho đơn hàng lớn
            </p>
          </div>
        )}
      </div>

      {/* Date Range */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormDatePicker
          name="startDate"
          control={control}
          label="Ngày bắt đầu"
          placeholder="Chọn ngày bắt đầu"
          required
          error={errors.startDate?.message}
        />

        <FormDatePicker
          name="endDate"
          control={control}
          label="Ngày kết thúc"
          placeholder="Chọn ngày kết thúc"
          required
          error={errors.endDate?.message}
        />
      </div>

      {/* Is Recurring */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isRecurring"
          {...register("isRecurring")}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
        />
        <label
          htmlFor="isRecurring"
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Khuyến mãi lặp lại (áp dụng theo chu kỳ)
        </label>
      </div>

      {/* Applicable To */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Áp dụng cho <span className="text-red-500">*</span>
        </label>
        <select
          {...register("applicableTo")}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">Tất cả sản phẩm</option>
          <option value="category">Theo danh mục</option>
          <option value="product_group">Theo nhóm sản phẩm</option>
          <option value="specific_product">Sản phẩm cụ thể</option>
          <option value="customer_group">Theo nhóm khách hàng</option>
        </select>
      </div>

      {/* Conditions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Giá trị đơn hàng tối thiểu
          </label>
          <div className="relative">
            <input
              type="number"
              step="1000"
              {...register("minOrderValue", { valueAsNumber: true })}
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              đ
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Số lượng tối thiểu
          </label>
          <input
            type="number"
            {...register("minQuantity", { valueAsNumber: true })}
            placeholder="0"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {/* Quantity Limit */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Giới hạn số lượng khuyến mãi
        </label>
        <input
          type="number"
          {...register("quantityLimit", { valueAsNumber: true })}
          placeholder="VD: 100 (chỉ 100 đơn đầu tiên)"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500">
          Để trống nếu không giới hạn
        </p>
      </div>

      {/* Advanced Conditions Builder */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => setShowConditionsBuilder(!showConditionsBuilder)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">
              Điều kiện nâng cao
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {showConditionsBuilder ? "Ẩn" : "Hiển thị"}
          </span>
        </button>

        {showConditionsBuilder && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cấu hình điều kiện chi tiết cho khuyến mãi (JSON format)
            </p>
            <textarea
              value={JSON.stringify(conditions, null, 2)}
              onChange={(e) => {
                try {
                  setConditions(JSON.parse(e.target.value));
                } catch (error) {
                  // Invalid JSON, ignore
                }
              }}
              rows={10}
              className="w-full rounded-lg border border-gray-300 bg-white p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              placeholder={`{
  "daysOfWeek": [1, 2, 3, 4, 5],
  "timeSlots": [{"start": "09:00", "end": "18:00"}],
  "customerTypes": ["VIP", "Gold"]
}`}
            />
          </div>
        )}
      </div>

      {/* Products Section (if applicable_to = specific_product) */}
      {applicableTo === "specific_product" && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Sản phẩm áp dụng
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  productId: 0,
                  minQuantity: 1,
                  giftQuantity: 0,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm sản phẩm
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex-1 space-y-3">
                  <select
                    {...register(`products.${index}.productId`, {
                      valueAsNumber: true,
                    })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value={0}>Chọn sản phẩm...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.productName}
                      </option>
                    ))}
                  </select>

                  {(promotionType === "buy_x_get_y" ||
                    promotionType === "gift") && (
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          {...register(`products.${index}.giftProductId`, {
                            valueAsNumber: true,
                          })}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                          <option value={0}>Sản phẩm tặng...</option>
                          {products.map((product: any) => (
                            <option key={product.id} value={product.id}>
                              {product.productName}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          {...register(`products.${index}.giftQuantity`, {
                            valueAsNumber: true,
                          })}
                          placeholder="SL tặng"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    )}
                </div>

                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="rounded p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {applicableTo === "all" && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Sản phẩm áp dụng
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  productId: 0,
                  minQuantity: 1,
                  giftQuantity: 0,
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm sản phẩm
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="flex-1 space-y-3">
                  <select
                    {...register(`products.${index}.productId`, {
                      valueAsNumber: true,
                    })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value={0}>Tất cả sản phẩm</option>
                  </select>

                  {(promotionType === "buy_x_get_y" ||
                    promotionType === "gift") && (
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          {...register(`products.${index}.giftProductId`, {
                            valueAsNumber: true,
                          })}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                          <option value={0}>Sản phẩm tặng...</option>
                          {products.map((product: any) => (
                            <option key={product.id} value={product.id}>
                              {product.productName}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          {...register(`products.${index}.giftQuantity`, {
                            valueAsNumber: true,
                          })}
                          placeholder="SL tặng"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                    )}
                </div>

                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="rounded p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Preview */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-300">
          Xem trước
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-400">
          {promotionType === "percent_discount" &&
            `Giảm ${discountValue}% cho đơn hàng`}
          {promotionType === "fixed_discount" &&
            `Giảm ${discountValue?.toLocaleString()}đ cho đơn hàng`}
          {promotionType === "buy_x_get_y" && `Mua X tặng Y`}
          {promotionType === "gift" && `Tặng quà khi mua hàng`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="mr-2 h-4 w-4" />
            Hủy
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={loading}
          onClick={handleClick}
          isLoading={loading}

        >

          <FileText className="mr-2 h-4 w-4" />
          {loading ? "Đang lưu..." : initialData ? "Cập nhật chương trình" : "Tạo chương trình"}
        </Button>
      </div>
    </form>
  );
}