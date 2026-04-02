"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRole, useUpdateRole } from "@/hooks/api/useRoles";
import { updateRoleSchema } from "@/lib/validations";
import Button from "@/components/ui/button/Button";
import { ArrowLeft, Save } from "lucide-react";
import toast from "react-hot-toast";
import type { UpdateRoleFormData } from "@/lib/validations";

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const roleId = parseInt(params.id as string);

  const { data: roleDataWrapper, isLoading } = useRole(roleId);
  const updateRoleMutation = useUpdateRole(roleId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const role = (roleDataWrapper as any)?.data;
  const isSystemRole = role && ["admin", "user"].includes(role.roleKey);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateRoleFormData>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      roleName: role?.roleName || "",
      description: role?.description || "",
      status: role?.status || "active",
    },
    values: {
      roleName: role?.roleName || "",
      description: role?.description || "",
      status: role?.status || "active",
    },
  });

  const onSubmit = async (data: UpdateRoleFormData) => {
    setIsSubmitting(true);

    try {
      await updateRoleMutation.mutateAsync(data);
      router.push("/settings/roles");
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="mt-2 h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <div className="h-10 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>

        {/* Form Skeleton */}
        <div className="rounded-lg border bg-white p-6 shadow dark:bg-gray-800">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="mt-2 h-10 rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-red-500">Không tìm thấy vai trò</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chỉnh Sửa Vai Trò
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {role.roleName} ({role.roleKey})
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

      {/* System Role Warning */}
      {isSystemRole && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Đây là vai trò hệ thống. Một số trường không thể sửa đổi.
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border bg-white p-6 shadow dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Role Key (Read-only) */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mã Vai Trò <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={role.roleKey}
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                (Không thể sửa đổi)
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
                disabled={isSystemRole}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-800"
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
                placeholder="Mô tả ngắn gọn về vai trò"
                rows={4}
                {...register("description")}
                disabled={isSystemRole}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-800"
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
                disabled={isSystemRole}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-800"
              >
                <option value="active">Đang Sử Dụng</option>
                <option value="inactive">Không Sử Dụng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isSystemRole && (
          <div className="flex justify-end gap-3">
            <Link href="/settings/roles">
              <Button variant="outline" size="md" disabled={isSubmitting || updateRoleMutation.isPending}>
                Hủy
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting || updateRoleMutation.isPending}
            >
              {isSubmitting || updateRoleMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Đang Lưu...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Lưu Thay Đổi
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
