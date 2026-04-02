"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateRole } from "@/hooks/api/useRoles";
import { createRoleSchema } from "@/lib/validations";
import Button from "@/components/ui/button/Button";
import { ArrowLeft, Save } from "lucide-react";
import toast from "react-hot-toast";
import type { CreateRoleFormData } from "@/lib/validations";

export default function NewRolePage() {
  const router = useRouter();
  const createRoleMutation = useCreateRole();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      roleKey: "",
      roleName: "",
      description: "",
      status: "active",
    },
  });

  const onSubmit = async (data: CreateRoleFormData) => {
    setIsSubmitting(true);

    try {
      await createRoleMutation.mutateAsync(data);
      router.push("/settings/roles");
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tạo Vai Trò Mới
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Thêm vai trò mới vào hệ thống
          </p>
        </div>
        <Link
          href="/settings/roles"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border bg-white p-6 shadow dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Role Key */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mã Vai Trò <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: warehouse_manager"
                {...register("roleKey")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.roleKey && (
                <p className="mt-1 text-sm text-red-600">{errors.roleKey.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Chỉ cho phép chữ thường và dấu gạch dưới
              </p>
            </div>

            {/* Role Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tên Vai Trò <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: Quản Lý Kho"
                {...register("roleName")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.roleName && (
                <p className="mt-1 text-sm text-red-600">{errors.roleName.message}</p>
              )}
            </div>

            {/* Description - Full width */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mô Tả
              </label>
              <textarea
                placeholder="Mô tả ngắn gọn về vai trò và trách nhiệm"
                rows={4}
                {...register("description")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Trạng Thái <span className="text-red-500">*</span>
              </label>
              <select
                {...register("status")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="active">Đang Sử Dụng</option>
                <option value="inactive">Không Sử Dụng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/settings/roles">
            <Button variant="outline" size="md" disabled={isSubmitting || createRoleMutation.isPending}>
              Hủy
            </Button>
          </Link>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting || createRoleMutation.isPending}
          >
            {isSubmitting || createRoleMutation.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Đang Tạo...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Tạo Vai Trò
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
