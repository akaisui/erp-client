"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateSupplier } from "@/hooks/api";
import Button from "@/components/ui/button/Button";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { supplierSchema, type SupplierFormData } from "@/lib/validations/supplier.schema";

export default function CreateSupplierPage() {
  const router = useRouter();
  const createSupplier = useCreateSupplier();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      supplierType: "local",
      status: "active",
    },
  });

  const onSubmit = async (data: SupplierFormData) => {
    const cleanedData = {
      ...data,
      supplierCode: data.supplierCode.toUpperCase(),
    };
    try {
      const result = await createSupplier.mutateAsync(cleanedData);
      router.push(`/suppliers`);
    } catch (error) {
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tạo nhà cung cấp mới
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Thêm nhà cung cấp mới vào hệ thống
          </p>
        </div>
        <Button variant="outline" size="ssmm" onClick={() => router.push("/suppliers")}>
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Supplier Code */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mã NCC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("supplierCode")}
                  placeholder="VD: NCC-001"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                {errors.supplierCode && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.supplierCode.message}
                  </p>
                )}
              </div>

              {/* Supplier Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Loại NCC
                </label>
                <select
                  {...register("supplierType")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="local">Trong nước</option>
                  <option value="foreign">Nước ngoài</option>
                </select>
                {errors.supplierType && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.supplierType.message}
                  </p>
                )}
              </div>
            </div>

            {/* Supplier Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tên nhà cung cấp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("supplierName")}
                placeholder="Nhập tên nhà cung cấp"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {errors.supplierName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.supplierName.message}
                </p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Contact Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Người liên hệ
                </label>
                <input
                  type="text"
                  {...register("contactName")}
                  placeholder="Họ tên người liên hệ"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                {errors.contactName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.contactName.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  {...register("phone")}
                  placeholder="0123 456 789"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="email@example.com"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Tax Code */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mã số thuế
                </label>
                <input
                  type="text"
                  {...register("taxCode")}
                  placeholder="MST"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                {errors.taxCode && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.taxCode.message}
                  </p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Địa chỉ
              </label>
              <input
                type="text"
                {...register("address")}
                placeholder="Địa chỉ nhà cung cấp"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.address.message}
                </p>
              )}
            </div>

            {/* Payment Terms */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Điều khoản thanh toán
              </label>
              <input
                type="text"
                {...register("paymentTerms")}
                placeholder="VD: T/T 30 ngày"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {errors.paymentTerms && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.paymentTerms.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Trạng thái
              </label>
              <select
                {...register("status")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngưng hoạt động</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.status.message}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ghi chú
              </label>
              <textarea
                {...register("notes")}
                placeholder="Ghi chú về nhà cung cấp..."
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.notes.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            onClick={() => router.push('/suppliers')}
            variant="outline"
            size="sm"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            size="sm"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Đang tạo...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Tạo nhà cung cấp
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
