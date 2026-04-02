"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useCreateWarehouse, useUsers } from "@/hooks/api";
import { warehouseSchema, type WarehouseFormData } from "@/lib/validations/warehouse.schema";
import { useDebounce } from "@/hooks";
import { User } from "@/types";
import { ArrowLeft, X, Save } from "lucide-react";
import Button from "@/components/ui/button/Button";

export default function CreateWarehousePage() {
  const router = useRouter();
  const createWarehouse = useCreateWarehouse();
  const [managerSearch, setManagerSearch] = useState("");
  const debouncedSearch = useDebounce(managerSearch, 300);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      status: "active",
    },
  });

  const selectedManagerId = watch("managerId");

  const { data: usersResponseWrapper, isLoading: isLoadingUsers } = useUsers({
    search: debouncedSearch,
    status: "active",
    limit: 20,
  });
  const usersResponse = usersResponseWrapper?.data as unknown as User[];

  // Lọc user có quyền truy cập (admin, warehouse_manager, warehouse_staff)
  const allowedRoleKeys = ["admin", "warehouse_manager", "warehouse_staff"];
  const filteredUsers = usersResponse?.filter(
    (user) => user.role && allowedRoleKeys.includes(user.role.roleKey)
  ) || [];

  const onSubmit = async (data: WarehouseFormData) => {
    try {
      await createWarehouse.mutateAsync(data);
      router.push("/warehouses");
    } catch (error) {}
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tạo kho mới
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Thêm kho mới vào hệ thống
          </p>
        </div>
        <Button
          onClick={() => router.back()}
          variant="outline"
          size="ssmm"
        >
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Warehouse Code */}
            <div>
              <label
                htmlFor="warehouseCode"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Mã kho <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="warehouseCode"
                {...register("warehouseCode")}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                placeholder="VD: WH-001"
              />
              {errors.warehouseCode && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.warehouseCode.message}
                </p>
              )}
            </div>

            {/* Warehouse Name */}
            <div>
              <label
                htmlFor="warehouseName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Tên kho <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="warehouseName"
                {...register("warehouseName")}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                placeholder="VD: Kho nguyên liệu Hà Nội"
              />
              {errors.warehouseName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.warehouseName.message}
                </p>
              )}
            </div>

            {/* Warehouse Type */}
            <div>
              <label
                htmlFor="warehouseType"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Loại kho <span className="text-red-500">*</span>
              </label>
              <select
                id="warehouseType"
                {...register("warehouseType")}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">-- Chọn loại kho --</option>
                <option value="raw_material">Nguyên liệu</option>
                <option value="packaging">Bao bì</option>
                <option value="finished_product">Thành phẩm</option>
                <option value="goods">Hàng hóa</option>
              </select>
              {errors.warehouseType && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.warehouseType.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Trạng thái
              </label>
              <select
                id="status"
                {...register("status")}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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

            {/* Manager Selector */}
            <div className="sm:col-span-2">
              <label
                htmlFor="managerId"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Quản lý kho
              </label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm người quản lý..."
                  value={managerSearch}
                  onChange={(e) => setManagerSearch(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                />
                {isLoadingUsers && (
                  <div className="absolute right-3 top-2.5">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                  </div>
                )}
                {filteredUsers && filteredUsers.length > 0 && managerSearch && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
                    <ul className="max-h-60 overflow-auto py-1">
                      {filteredUsers.map((user) => (
                        <li
                          key={user.id}
                          onClick={() => {
                            setValue("managerId", user.id);
                            setManagerSearch(user.fullName);
                          }}
                          className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.fullName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {user.employeeCode} • {user.email}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {selectedManagerId && (
                <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-2 dark:border-blue-800 dark:bg-blue-900/20">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium text-blue-900 dark:text-blue-200">
                        Đã chọn: {filteredUsers.find(u => u.id === selectedManagerId)?.fullName || managerSearch}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setValue("managerId", undefined);
                        setManagerSearch("");
                      }}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
              {errors.managerId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.managerId.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Địa chỉ
              </label>
              <input
                type="text"
                id="address"
                {...register("address")}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                placeholder="VD: 123 Đường ABC, Quận XYZ"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.address.message}
                </p>
              )}
            </div>

            {/* City */}
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Thành phố
              </label>
              <input
                type="text"
                id="city"
                {...register("city")}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                placeholder="VD: Hà Nội"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.city.message}
                </p>
              )}
            </div>

            {/* Region */}
            <div>
              <label
                htmlFor="region"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Khu vực
              </label>
              <input
                type="text"
                id="region"
                {...register("region")}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                placeholder="VD: Miền Bắc"
              />
              {errors.region && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.region.message}
                </p>
              )}
            </div>

            {/* Capacity */}
            <div>
              <label
                htmlFor="capacity"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Sức chứa (m³)
              </label>
              <input
                type="number"
                id="capacity"
                {...register("capacity", { valueAsNumber: true })}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                placeholder="VD: 1000"
              />
              {errors.capacity && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.capacity.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Mô tả
              </label>
              <textarea
                id="description"
                rows={3}
                {...register("description")}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                placeholder="Mô tả chi tiết về kho..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="smm"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            size="smm"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Đang tạo...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Tạo kho
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
