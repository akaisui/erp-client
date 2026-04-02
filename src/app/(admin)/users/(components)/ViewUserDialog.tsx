"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  useUser,
  useUpdateUserStatus,
  useUploadAvatar,
  useDeleteAvatar,
  useDeleteUser,
  useChangeUserPassword,
  useUserActivityLogs,
  ActivityLogsResponse,
} from "@/hooks/api/useUsers";
import {
  useUserPermissions,
  useUserEffectivePermissions,
  useAllPermissions,
  useAssignUserPermission,
  useRevokeUserPermission,
} from "@/hooks/api/useUserPermissions";
import { Can } from "@/components/auth";
import UserStatusBadge, {
  GenderDisplay,
  LastLoginDisplay,
  UserAvatar,
} from "@/components/users/UserStatus";
import ActivityTimeline from "@/components/users/ActivityTimeline";
import type { User, UserStatus } from "@/types";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Warehouse,
  Shield,
  Clock,
  Key,
  Edit,
  EyeOff,
  Eye,
  Trash2,
  Upload,
  UserCheck,
  UserX,
  Lock,
  X,
} from "lucide-react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import ConfirmDialog from "@/components/ui/modal/ConfirmDialog";
import { UserDialog } from "./UserDialog"; // Import UserDialog for Edit mode switch

interface ViewUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number | null;
  onEdit?: (user: User) => void;
}

export function ViewUserDialog({ isOpen, onClose, userId, onEdit }: ViewUserDialogProps) {
  const { data, isLoading, refetch } = useUser(userId || 0);
  const user = data?.data as unknown as User;

  const updateStatus = useUpdateUserStatus();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const deleteUser = useDeleteUser();
  const changePassword = useChangeUserPassword();
  
  // Permissions hooks
  const { data: userPermissionsResponse, isLoading: isLoadingUserPermissions } = useUserPermissions(userId || 0);
  const userPermissions = (userPermissionsResponse as unknown as any[]) || [];
  const { data: effectivePermissionsResponse } = useUserEffectivePermissions(userId || 0);
  const effectivePermissions = (effectivePermissionsResponse as any)?.effectivePermissions;
  const rolePermissions = (effectivePermissionsResponse as any)?.rolePermissions as any[];
  const { data: allPermissionsResponseWrapper } = useAllPermissions();
  const allPermissionsResponse = allPermissionsResponseWrapper as any;
  const assignPermission = useAssignUserPermission(userId || 0);
  const revokePermission = useRevokeUserPermission(userId || 0);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>("active");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"activity" | "attendance" | "salary" | "performance" | "permissions">("activity");
  const [showDeleteAvatarConfirm, setShowDeleteAvatarConfirm] = useState(false);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [avatarValidationError, setAvatarValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch related data
  const { data: activityLogsDataWrapper, isLoading: isLoadingLogs } = useUserActivityLogs(userId || 0);
  const activityLogsData = activityLogsDataWrapper as unknown as ActivityLogsResponse;

  const handleStatusChange = async () => {
    if (!userId) return;
    try {
      await updateStatus.mutateAsync({ id: userId, data: { status: selectedStatus } });
      setShowStatusModal(false);
      refetch();
    } catch (error) {}
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
     if (!userId) return;
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAvatarValidationError("Kích thước file không được vượt quá 5MB");
      return;
    }

    if (!["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type)) {
      setAvatarValidationError("Chỉ hỗ trợ file ảnh định dạng JPEG, PNG, JPG hoặc WEBP");
      return;
    }

    setAvatarValidationError(null);
    try {
      await uploadAvatar.mutateAsync({ id: userId, file });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      refetch();
    } catch (error) {}
  };

  const handleDeleteAvatar = async () => {
      if (!userId) return;
    try {
      await deleteAvatar.mutateAsync(userId);
      setShowDeleteAvatarConfirm(false);
      refetch();
    } catch (error) {}
  };

  const confirmDeleteUser = async () => {
    if (!userId) return;
    try {
      await deleteUser.mutateAsync(userId);
      setShowDeleteUserConfirm(false);
      onClose(); // Close dialog after delete
      // Ideally refresh list
      window.location.reload(); 
    } catch (error) {
      setShowDeleteUserConfirm(false);
    }
  };

   if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="!max-w-none w-[98vw] h-[95vh] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Thông tin nhân viên
          </h2>
          {user && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {user.employeeCode} - {user.fullName}
            </p>
          )}
        </div>
        <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800"
        >
            <X className="h-6 w-6" />
        </button>
      </div>

       {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-gray-500 dark:text-gray-400">Đang tải...</div>
          </div>
        ) : !user ? (
          <div className="flex flex-1 items-center justify-center">
             <p className="text-gray-500 dark:text-gray-400">Không tìm thấy nhân viên</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
             <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Column */}
                <div className="space-y-6">
                   {/* Avatar Card */}
                   <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
                      <div className="flex flex-col items-center">
                        <UserAvatar
                          avatarUrl={user.avatarUrl}
                          fullName={user.fullName}
                          size="xl"
                          showOnlineStatus={false}
                        />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                            {user.fullName}
                        </h3>
                         <div className="mt-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {user.employeeCode}
                          </div>
                          <div className="mt-3">
                            <UserStatusBadge status={user.status} showIcon />
                          </div>

                          <div className="mt-6 flex w-full flex-col gap-2">
                             <Can permission="update_user">
                                <>
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                  />
                                   <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadAvatar.isPending}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                  >
                                    <Upload className="h-4 w-4" />
                                    {uploadAvatar.isPending ? "Đang tải..." : "Tải ảnh lên"}
                                  </button>
                                  {user.avatarUrl && (
                                    <button
                                      onClick={handleDeleteAvatar}
                                      disabled={deleteAvatar.isPending}
                                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-600 dark:bg-red-800 dark:text-red-300 dark:hover:bg-red-700"
                                    >
                                      {deleteAvatar.isPending ? "Đang xóa..." : "Xóa ảnh"}
                                    </button>
                                  )}
                                </>
                             </Can>
                          </div>
                      </div>
                   </div>

                    {/* Status Actions */}
                    <Can permission="update_user">
                        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
                          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                            Thay đổi trạng thái
                          </h4>
                          <div className="flex flex-col gap-2">
                             <button
                                onClick={() => {
                                    setSelectedStatus("active");
                                    setShowStatusModal(true);
                                }}
                                disabled={user.status === "active"}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-300 bg-white px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-green-800 dark:bg-gray-800 dark:hover:bg-green-900/20"
                                >
                                <UserCheck className="h-4 w-4" />
                                Kích hoạt
                            </button>
                             <button
                                onClick={() => {
                                    setSelectedStatus("inactive");
                                    setShowStatusModal(true);
                                }}
                                disabled={user.status === "inactive"}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                <UserX className="h-4 w-4" />
                                Vô hiệu hóa
                            </button>
                             <button
                                onClick={() => {
                                    setSelectedStatus("locked");
                                    setShowStatusModal(true);
                                }}
                                disabled={user.status === "locked"}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:bg-gray-800 dark:hover:bg-red-900/20"
                                >
                                <Lock className="h-4 w-4" />
                                Khóa tài khoản
                            </button>
                          </div>
                        </div>
                    </Can>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Info Cards */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                            Thông tin cá nhân
                        </h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                             <div className="flex items-start gap-3">
                                <Mail className="mt-0.5 h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                                </div>
                             </div>
                             <div className="flex items-start gap-3">
                                <Phone className="mt-0.5 h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Số điện thoại</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{user.phone || "—"}</p>
                                </div>
                             </div>
                              <div className="flex items-start gap-3">
                                <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Ngày sinh</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                    {user.dateOfBirth ? (
                                        <span>
                                          {new Date(user.dateOfBirth).toLocaleDateString("vi-VN")}
                                          {" ("}
                                          {Math.floor(
                                            (new Date().getTime() - new Date(user.dateOfBirth).getTime()) /
                                              (365.25 * 24 * 60 * 60 * 1000)
                                          )}{" "}
                                          tuổi)
                                        </span>
                                      ) : (
                                        "—"
                                      )}
                                    </p>
                                </div>
                             </div>
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 h-5 w-5 text-gray-400">⚧</div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Giới tính</p>
                                    <div className="font-medium">
                                        <GenderDisplay gender={user.gender} />
                                    </div>
                                </div>
                             </div>
                              <div className="flex items-start gap-3 sm:col-span-2">
                                <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Địa chỉ</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{user.address || "—"}</p>
                                </div>
                             </div>
                             {/* CCCD & Issued Info */}
                             <div className="flex items-start gap-3">
                                  <Shield className="mt-0.5 h-5 w-5 text-gray-400" />
                                  <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">CCCD/ID</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {user.cccd || "—"}
                                    </p>
                                  </div>
                             </div>
                             <div className="flex items-start gap-3">
                                  <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                                  <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Ngày cấp CCCD</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {user.issuedAt
                                        ? new Date(user.issuedAt).toLocaleDateString("vi-VN")
                                        : "—"}
                                    </p>
                                  </div>
                             </div>
                             <div className="flex items-start gap-3 sm:col-span-2">
                                  <Briefcase className="mt-0.5 h-5 w-5 text-gray-400" />
                                  <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Nơi cấp CCCD</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {user.issuedBy || "—"}
                                    </p>
                                  </div>
                             </div>
                        </div>
                    </div>

                    {/* Work Info */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
                       <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Thông tin công việc
                      </h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex items-start gap-3">
                          <Briefcase className="mt-0.5 h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Mã nhân viên</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.employeeCode}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Shield className="mt-0.5 h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Vai trò</p>
                             <p className="font-medium text-blue-600 dark:text-blue-400">
                                {user.role?.roleName || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Clock className="mt-0.5 h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Ngày tham gia</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                        </div>
                         <div className="flex items-start gap-3 sm:col-span-2">
                          <Warehouse className="mt-0.5 h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Kho làm việc</p>
                            {user.warehouse ? (
                              <div>
                                <p className="font-medium text-blue-600 dark:text-blue-400">
                                    {user.warehouse.warehouseName|| "—"}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {user.warehouse.warehouseCode}
                                </p>
                              </div>
                            ) : (
                              <p className="font-medium text-gray-900 dark:text-white">—</p>
                            )}
                          </div>
                        </div>
                         <div className="flex items-start gap-3">
                          <Clock className="mt-0.5 h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Đăng nhập lần cuối
                            </p>
                            <div className="font-medium text-gray-900 dark:text-white">
                              <LastLoginDisplay lastLogin={user.lastLogin} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* System Info */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
                      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Thông tin hệ thống
                      </h3>
                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Ngày tạo:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {new Date(user.createdAt).toLocaleString("vi-VN")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Cập nhật lần cuối:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {new Date(user.updatedAt).toLocaleString("vi-VN")}
                          </span>
                        </div>
                      </div>
                    </div>

                     {/* Tabs */}
                    <div className="space-y-6">
                        <div className="border-b border-gray-200 dark:border-gray-700">
                             <div className="flex gap-8 overflow-x-auto">
                                <Can permission="view_attendance">
                                  <button
                                    onClick={() => setActiveTab("attendance")}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                                      activeTab === "attendance"
                                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                    }`}
                                  >
                                    Chấm công
                                  </button>
                                </Can>
                                <Can permission="view_salary">
                                  <button
                                    onClick={() => setActiveTab("salary")}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                                      activeTab === "salary"
                                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                    }`}
                                  >
                                    Lương & Thưởng
                                  </button>
                                </Can>
                                <button
                                    onClick={() => setActiveTab("activity")}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                                        activeTab === "activity"
                                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    Nhật ký hoạt động
                                </button>
                                <button
                                  onClick={() => setActiveTab("performance")}
                                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                                    activeTab === "performance"
                                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                  }`}
                                >
                                  Hiệu suất
                                </button>
                                <Can permission="update_user">
                                  <button
                                    onClick={() => setActiveTab("permissions")}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                                      activeTab === "permissions"
                                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                    }`}
                                  >
                                    Quyền chi tiết
                                  </button>
                                </Can>
                             </div>
                        </div>

                         <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
                              {activeTab === "attendance" && (
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Chấm công
                                  </h3>
                                  <div className="rounded-lg bg-gray-50 p-6 text-center dark:bg-gray-800">
                                    <p className="text-gray-500 dark:text-gray-400">
                                      Chức năng chấm công sẽ được triển khai
                                    </p>
                                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                      (Cần fetch từ Attendance API với userId)
                                    </p>
                                  </div>
                                </div>
                              )}
                              {activeTab === "salary" && (
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Lương & Thưởng
                                  </h3>
                                  <div className="rounded-lg bg-gray-50 p-6 text-center dark:bg-gray-800">
                                    <p className="text-gray-500 dark:text-gray-400">
                                      Chức năng lương sẽ được triển khai
                                    </p>
                                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                      (Cần fetch từ Salary API với userId - Nhạy cảm, chỉ Admin/HR/chính nhân viên xem)
                                    </p>
                                  </div>
                                </div>
                              )}
                              {activeTab === "activity" && (
                                    <ActivityTimeline
                                        logs={activityLogsData?.data || []}
                                        isLoading={isLoadingLogs}
                                    />
                              )}
                              {activeTab === "performance" && (
                                <div className="space-y-4">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Hiệu suất
                                  </h3>
                                  <div className="rounded-lg bg-gray-50 p-6 text-center dark:bg-gray-800">
                                    <p className="text-gray-500 dark:text-gray-400">
                                      Chức năng hiệu suất sẽ được triển khai
                                    </p>
                                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                      (Tùy biến theo role: Sale → Đơn hàng, Thủ kho → Stock transactions, Giao hàng → Deliveries)
                                    </p>
                                  </div>
                                </div>
                              )}
                              {activeTab === "permissions" && (
                                <div className="space-y-6">
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                      Quyền chi tiết
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      Gán quyền riêng cho người dùng này, vượt quá quyền của vai trò
                                    </p>
                                  </div>

                                  {/* Role Permissions Info */}
                                  {effectivePermissions && (
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                                        📋 Quyền từ vai trò
                                      </h4>
                                      <div className="flex flex-wrap gap-2">
                                        {rolePermissions.length > 0 ? (
                                          rolePermissions.map((perm) => (
                                            <span key={perm} className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-medium dark:bg-blue-900/40 dark:text-blue-300">
                                              {perm}
                                            </span>
                                          ))
                                        ) : (
                                          <p className="text-sm text-blue-700 dark:text-blue-400">Không có quyền từ vai trò</p>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Current User Permissions */}
                                  {isLoadingUserPermissions ? (
                                    <div className="text-center py-8">
                                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                                    </div>
                                  ) : (
                                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                        Quyền được gán riêng
                                      </h4>
                                      {userPermissions.length > 0 ? (
                                        <div className="space-y-2">
                                          {userPermissions.map((perm) => (
                                            <div key={perm.permissionId} className="flex items-center justify-between p-2 rounded border border-gray-100 dark:border-gray-700">
                                              <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{perm.permissionName}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{perm.permissionKey}</p>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-1 rounded font-medium ${
                                                  perm.grantType === 'grant' 
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                  {perm.grantType === 'grant' ? 'Cho phép' : 'Bỏ quyền'}
                                                </span>
                                                <button
                                                  onClick={() => revokePermission.mutate(perm.permissionId)}
                                                  disabled={revokePermission.isPending}
                                                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50"
                                                >
                                                  Xóa
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">Chưa có quyền được gán riêng</p>
                                      )}
                                    </div>
                                  )}

                                  {/* Add Permission Button */}
                                  <button
                                    onClick={() => {
                                      setSelectedPermissions([]);
                                      setShowPermissionDialog(true);
                                    }}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    ➕ Thêm quyền
                                  </button>
                                </div>
                              )}
                         </div>
                    </div>
                </div>
             </div>
          </div>
        )}

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-900">
         <Can permission="update_user">
            <Button
              variant="gradient"
              onClick={() => setShowPasswordModal(true)}
            >
              <Key className="mr-2 h-4 w-4" />
              Đổi mật khẩu
            </Button>
            <Button
                variant="primary"
                onClick={() => {
                   if (onEdit && user) onEdit(user);
                }}
            >
                <Edit className="mr-2 h-4 w-4" />
                Chỉnh sửa
            </Button>
         </Can>
         <Can permission="delete_user">
            <Button
              variant="danger"
              onClick={() => setShowDeleteUserConfirm(true)}
              disabled={deleteUser.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </Button>
         </Can>
         <Button variant="outline" onClick={onClose}>
            Đóng
         </Button>
      </div>

       {/* Status Modal */}
       {showStatusModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50">
           <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-xl">
               <h3 className="text-lg font-bold text-gray-900 dark:text-white">Xác nhận thay đổi trạng thái</h3> 
               <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Bạn có chắc chắn muốn thay đổi trạng thái tài khoản thành <strong>{{ active: "Hoạt động", inactive: "Ngưng hoạt động", locked: "Bị khóa" }[selectedStatus]}</strong>?
               </p>
               <div className="mt-6 flex justify-end gap-3">
                   <button onClick={() => setShowStatusModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Hủy</button>
                   <button onClick={handleStatusChange} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Xác nhận</button>
               </div>
           </div>
        </div>
       )}

       {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Đổi mật khẩu nhân viên
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Nhập mật khẩu mới cho {user?.fullName}
            </p>

            <div className="mt-6 space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mật khẩu mới
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Xác nhận mật khẩu
                </label>
                <div className="relative mt-1">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Xác nhận mật khẩu"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {newPassword !== confirmPassword && newPassword && confirmPassword && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Mật khẩu xác nhận không khớp
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  if (!userId) return;
                  try {
                    await changePassword.mutateAsync({
                      id: userId,
                      password: newPassword,
                    });
                    setShowPasswordModal(false);
                    setNewPassword("");
                    setConfirmPassword("");
                  } catch (error) {
                    console.error("Password change error:", error);
                  }
                }}
                disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || changePassword.isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {changePassword.isPending ? "Đang cập nhật..." : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Assignment Dialog */}
      {showPermissionDialog && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-900 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Gán quyền cho {user?.fullName}
              </h3>
              <button
                onClick={() => {
                  setShowPermissionDialog(false);
                  setSelectedPermissions([]);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Permissions Grid - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
              {allPermissionsResponse?.grouped ? (
                Object.entries(allPermissionsResponse.grouped).map(([module, permissions]: [string, any]) => (
                  <div key={module} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-xs sm:text-sm leading-tight">
                       {/* Simplified Module Names mapping */}
                      {module === 'finance' ? '💰 Tài chính' : 
                       module === 'hr' ? '👥 Nhân sự' :
                       module === 'sales' ? '📊 Bán hàng' :
                       module === 'warehouse' ? '📦 Kho' :
                       module === 'procurement' ? '🛒 Mua hàng' :
                       module === 'production' ? '🏭 Sản xuất' :
                       module === 'products' ? '📱 Sản phẩm' :
                       module === 'reports' ? '📈 Báo cáo' :
                       module === 'users' ? '👤 Người dùng' :
                       module === 'suppliers' ? '🤝 Nhà cung cấp' :
                       module === 'settings' ? '⚙️ Cài đặt' :
                       module === 'system' ? '🖥️ Hệ thống' : module}
                    </h4>
                    <div className="space-y-1.5">
                      {permissions.map((perm: any) => {
                        const isAlreadyAssigned = userPermissions.some(up => up.permissionId === perm.id);
                        const isSelected = selectedPermissions.includes(perm.id);
                        return (
                          <label key={perm.id} className="flex items-start gap-2 p-1.5 rounded hover:bg-white dark:hover:bg-gray-700 cursor-pointer transition">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPermissions([...selectedPermissions, perm.id]);
                                } else {
                                  setSelectedPermissions(selectedPermissions.filter(id => id !== perm.id));
                                }
                              }}
                              disabled={isAlreadyAssigned}
                              className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer mt-0.5 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white text-xs leading-tight">{perm.permissionName}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 break-words">{perm.permissionKey}</p>
                              {isAlreadyAssigned && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 italic">Đã gán</span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm col-span-full">Không có quyền nào khả dụng</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowPermissionDialog(false);
                  setSelectedPermissions([]);
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  for (const permId of selectedPermissions) {
                    await assignPermission.mutateAsync({ permissionId: permId, grantType: 'grant' });
                  }
                  setShowPermissionDialog(false);
                  setSelectedPermissions([]);
                }}
                disabled={selectedPermissions.length === 0 || assignPermission.isPending}
                className="rounded-lg bg-blue-600 px-3 sm:px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assignPermission.isPending ? 'Đang lưu...' : `Lưu (${selectedPermissions.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Validation Error Toast */}
      {avatarValidationError && (
        <div className="fixed bottom-4 right-4 z-[100000] rounded-lg bg-red-100 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <div className="text-lg">⚠️</div>
            <div className="flex-1">
              <p className="font-medium">{avatarValidationError}</p>
            </div>
            <button
              onClick={() => setAvatarValidationError(null)}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Delete Avatar Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteAvatarConfirm}
        onClose={() => setShowDeleteAvatarConfirm(false)}
        onConfirm={handleDeleteAvatar}
        title="Xóa ảnh đại diện"
        message="Bạn có chắc chắn muốn xóa ảnh đại diện của nhân viên này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteAvatar.isPending}
      />

      {/* Delete User Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteUserConfirm}
        onClose={() => setShowDeleteUserConfirm(false)}
        onConfirm={confirmDeleteUser}
        title="Xóa nhân viên"
        message={`Bạn có chắc chắn muốn xóa nhân viên "${user?.fullName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteUser.isPending}
      />

    </Modal>
  );
}
