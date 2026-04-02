"use client";
import React from "react";
import type { User } from "@/types";
import { format } from "date-fns";

interface UserInfoCardProps {
  user: User;
  canEdit: boolean;
}

export default function UserInfoCard({ user, canEdit }: UserInfoCardProps) {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Thông Tin Cá Nhân
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Họ Tên
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.fullName}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.email}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Số Điện Thoại
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.phone || "Chưa cập nhật"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Giới Tính
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.gender === "male" ? "Nam" : user.gender === "female" ? "Nữ" : "Khác"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Ngày Sinh
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.dateOfBirth ? format(new Date(user.dateOfBirth), "dd/MM/yyyy") : "Chưa cập nhật"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Mã Nhân Viên
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.employeeCode}
              </p>
            </div>

            {user.cccd && (
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Số CCCD
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.cccd}
                </p>
              </div>
            )}

            {user.issuedAt && (
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Ngày Cấp CCCD
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {format(new Date(user.issuedAt), "dd/MM/yyyy")}
                </p>
              </div>
            )}

            {user.issuedBy && (
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Nơi Cấp
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.issuedBy}
                </p>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Địa Chỉ
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.address || "Chưa cập nhật"}
              </p>
            </div>

            {user.role && (
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Vai Trò
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.role.roleName}
                </p>
              </div>
            )}

            {user.warehouse && (
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Kho Được Phân Công
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user.warehouse.warehouseName}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-auto">
          <h4 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            Thông Tin Hệ Thống
          </h4>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${user.status === "active" ? "bg-green-500" : "bg-red-500"}`}></div>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.status === "active" ? "Đang Hoạt Động" : user.status === "inactive" ? "Không Hoạt Động" : "Bị Khóa"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${user.canEditProfile ? "bg-blue-500" : "bg-gray-400"}`}></div>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.canEditProfile ? "Có Quyền Chỉnh Sửa" : "Không Có Quyền Chỉnh Sửa"}
              </p>
            </div>
            {user.lastLogin && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Đăng nhập cuối: {format(new Date(user.lastLogin), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            )}
            {user.createdAt && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tạo: {format(new Date(user.createdAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            )}
            {user.updatedAt && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cập nhật: {format(new Date(user.updatedAt), "dd/MM/yyyy HH:mm")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
