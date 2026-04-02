"use client";

/**
 * Customer Form Component
 * Form tạo/chỉnh sửa khách hàng - reusable component
 */

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCustomerSchema,
  updateCustomerSchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
} from "@/lib/validations";
import { Customer } from "@/types";
import Button from "@/components/ui/button/Button";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { FormDatePicker } from "@/components/form/FormDatePicker";
import { Save, X } from "lucide-react";
import {
  CUSTOMER_TYPES,
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_CLASSIFICATIONS,
  CUSTOMER_CLASSIFICATION_LABELS,
  CUSTOMER_STATUSES,
  CUSTOMER_STATUS_LABELS,
  GENDERS,
  GENDER_LABELS,
} from "@/lib/constants";
import { VIETNAM_PROVINCES } from "@/types";

interface CustomerFormProps {
  customer?: Customer;
  isEdit?: boolean;
  onSubmit: (data: CreateCustomerInput | UpdateCustomerInput) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  hideActions?: boolean;
  formId?: string;
}

export default function CustomerForm({
  customer,
  isEdit = false,
  onSubmit,
  onCancel,
  isLoading = false,
  hideActions = false,
  formId,
}: CustomerFormProps) {
  // Form Setup
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateCustomerInput | UpdateCustomerInput>({
    resolver: zodResolver(isEdit ? updateCustomerSchema : createCustomerSchema),
    defaultValues: {
      customerType: "individual",
      classification: "retail",
      creditLimit: 0,
      rewardPoints: 0,
      status: "active",
      gender: "male",
    },
  });

  // Reset form data when customer prop changes (Important for Dialog reuse)
  useEffect(() => {
    if (isEdit && customer) {
      reset({
        customerCode: customer.customerCode,
        customerName: customer.customerName,
        customerType: customer.customerType,
        classification: customer.classification,
        gender: customer.gender || "male",
        contactPerson: customer.contactPerson || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        province: customer.province || "",
        district: customer.district || "",
        taxCode: customer.taxCode || "",
        cccd: customer.cccd || "",
        issuedAt: customer.issuedAt
          ? new Date(customer.issuedAt).toISOString().split("T")[0]
          : undefined,
        issuedBy: customer.issuedBy || "",
        creditLimit: customer.creditLimit || 0,
        rewardPoints: customer.rewardPoints || 0,
        rewardCode: customer.rewardCode || "",
        notes: customer.notes || "",
        status: customer.status || "active",
      });
    } else if (!isEdit) {
      // Reset to defaults for Create mode
      reset({
        customerType: "individual",
        classification: "retail",
        creditLimit: 0,
        rewardPoints: 0,
        status: "active",
        gender: "male",
        customerCode: "",
        customerName: "",
        phone: "",
        email: "",
        // ... clear other fields explicitly if needed
      });
    }
  }, [customer, isEdit, reset]);

  const watchCustomerType = watch("customerType");
  const watchProvince = watch("province");

  return (
    <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Thông tin cơ bản
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Customer Code */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mã khách hàng
            </label>
            <input
              type="text"
              {...register("customerCode")}
              placeholder="VD: KH001"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
              disabled={isEdit} // Mã KH thường không cho sửa
            />
            {errors.customerCode && (
              <p className="mt-1 text-sm text-red-600">{errors.customerCode.message}</p>
            )}
          </div>

          {/* Customer Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {watchCustomerType === "company" ? "Tên công ty" : "Tên khách hàng"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("customerName")}
              placeholder={
                watchCustomerType === "company"
                  ? "VD: Công ty TNHH ABC"
                  : "VD: Nguyễn Văn A"
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {errors.customerName && (
              <p className="mt-1 text-sm text-red-600">{errors.customerName.message}</p>
            )}
          </div>

          {/* Customer Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Loại khách hàng <span className="text-red-500">*</span>
            </label>
            <select
              {...register("customerType")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {Object.values(CUSTOMER_TYPES).map((type) => (
                <option key={type} value={type}>
                  {CUSTOMER_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            {errors.customerType && (
              <p className="mt-1 text-sm text-red-600">{errors.customerType.message}</p>
            )}
          </div>

          {/* Classification */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phân loại <span className="text-red-500">*</span>
            </label>
            <select
              {...register("classification")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {Object.values(CUSTOMER_CLASSIFICATIONS).map((classification) => (
                <option key={classification} value={classification}>
                  {CUSTOMER_CLASSIFICATION_LABELS[classification]}
                </option>
              ))}
            </select>
            {errors.classification && (
              <p className="mt-1 text-sm text-red-600">{errors.classification.message}</p>
            )}
          </div>

          {/* Gender - Only for Individual */}
          {watchCustomerType === "individual" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Giới tính
              </label>
              <select
                {...register("gender")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {Object.values(GENDERS).map((gender) => (
                  <option key={gender} value={gender}>
                    {GENDER_LABELS[gender]}
                  </option>
                ))}
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>
          )}

          {/* Contact Person - Required for Company */}
          {watchCustomerType === "company" && (
            <div className="sm:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Người liên hệ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("contactPerson")}
                placeholder="VD: Nguyễn Văn A"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {errors.contactPerson && (
                <p className="mt-1 text-sm text-red-600">{errors.contactPerson.message}</p>
              )}
            </div>
          )}

          {/* Tax Code - Required for Company */}
          {watchCustomerType === "company" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mã số thuế <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("taxCode")}
                placeholder="VD: 0123456789"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {errors.taxCode && (
                <p className="mt-1 text-sm text-red-600">{errors.taxCode.message}</p>
              )}
            </div>
          )}

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Trạng thái
            </label>
            <select
              {...register("status")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {Object.values(CUSTOMER_STATUSES).map((status) => (
                <option key={status} value={status}>
                  {CUSTOMER_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Thông tin liên hệ
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Phone */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              {...register("phone")}
              placeholder="VD: 0987654321"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              {...register("email")}
              placeholder="VD: customer@example.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Địa chỉ
            </label>
            <input
              type="text"
              {...register("address")}
              placeholder="VD: 123 Đường ABC"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>

          {/* Province */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tỉnh/Thành phố
            </label>
            <SearchableSelect
              options={VIETNAM_PROVINCES.map((p) => ({ value: p, label: p }))}
              value={watchProvince || ""}
              onChange={(value) => setValue("province", String(value))}
              placeholder="Chọn tỉnh/thành phố..."
            />
            {errors.province && (
              <p className="mt-1 text-sm text-red-600">{errors.province.message}</p>
            )}
          </div>

          {/* District */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Quận/Huyện
            </label>
            <input
              type="text"
              {...register("district")}
              placeholder="VD: Quận 1"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {errors.district && (
              <p className="mt-1 text-sm text-red-600">{errors.district.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Identity Information */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Thông tin chứng thực
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* CCCD */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              CCCD/CMND
            </label>
            <input
              type="text"
              {...register("cccd")}
              placeholder="VD: 123456789012"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {errors.cccd && (
              <p className="mt-1 text-sm text-red-600">{errors.cccd.message}</p>
            )}
          </div>

          {/* Issued At */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ngày cấp
            </label>
            <FormDatePicker
              name="issuedAt"
              control={control}
              label={undefined}
              placeholder="Chọn ngày cấp"
              className="w-full"
            />
            {errors.issuedAt && (
              <p className="mt-1 text-sm text-red-600">{errors.issuedAt.message}</p>
            )}
          </div>

          {/* Issued By */}
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nơi cấp
            </label>
            <input
              type="text"
              {...register("issuedBy")}
              placeholder="VD: Công an TP. HCM"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {errors.issuedBy && (
              <p className="mt-1 text-sm text-red-600">{errors.issuedBy.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Financial Information */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Thông tin tài chính
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Credit Limit */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hạn mức công nợ (VND)
            </label>
            <input
              type="number"
              {...register("creditLimit", { valueAsNumber: true })}
              min="0"
              step="1000"
              placeholder="0"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {errors.creditLimit && (
              <p className="mt-1 text-sm text-red-600">{errors.creditLimit.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Hạn mức công nợ tối đa được phép
            </p>
          </div>
        </div>
      </div>
      
      {/* Reward Information */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Thông tin tích điểm
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Reward Points */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Điểm thưởng
            </label>
            <input
              type="number"
              {...register("rewardPoints", { valueAsNumber: true })}
              min="0"
              placeholder="0"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {errors.rewardPoints && (
              <p className="mt-1 text-sm text-red-600">{errors.rewardPoints.message}</p>
            )}
          </div>

          {/* Reward Code */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mã thưởng (Code)
            </label>
            <input
              type="text"
              {...register("rewardCode")}
              placeholder="VD: VIP-2024"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            {errors.rewardCode && (
              <p className="mt-1 text-sm text-red-600">{errors.rewardCode.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Ghi chú</h2>

        <div>
          <textarea
            {...register("notes")}
            rows={4}
            placeholder="Ghi chú về khách hàng..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      {!hideActions && (
        <div className="flex items-center justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isLoading}>
              <X className="mr-2 h-4 w-4" />
              Hủy
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={isLoading} size="sm">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo khách hàng"}
          </Button>
        </div>
      )}
    </form>
  );
}