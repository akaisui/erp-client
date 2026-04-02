"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRoles } from "@/hooks/api/useRoles";
import { useWarehouses } from "@/hooks/api/useWarehouses";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormData,
  type UpdateUserFormData,
} from "@/lib/validations/user.schema";
import type { User } from "@/types";
import { Eye, EyeOff, Upload, X } from "lucide-react";
import { FormDatePicker } from "@/components/form/FormDatePicker";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { useDropzone } from "react-dropzone";
import { toast } from "react-hot-toast";
import { Modal } from "@/components/ui/modal";
import { useCreateUser, useUpdateUser, useUploadAvatar } from "@/hooks/api/useUsers";

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null; // If null/undefined, it's create mode
  contentClassName?: string;
  overlayClassName?: string;
}

export function UserDialog({
  isOpen,
  onClose,
  user,
  contentClassName,
  overlayClassName,
}: UserDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [selectedRoleNeedsWarehouse, setSelectedRoleNeedsWarehouse] = useState(false);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const uploadAvatar = useUploadAvatar();
  
  const mode = user ? "edit" : "create";
  const isLoading = createUser.isPending || updateUser.isPending || uploadAvatar.isPending;

  // Fetch roles and warehouses
  const { data: rolesData } = useRoles({ status: "active", limit: 1000 });
  const { data: warehousesData } = useWarehouses({ status: "active", limit: 1000 });

  const roles = (rolesData as any)?.data || [];
  const warehouses = (warehousesData as any)?.data || [];

  // Form validation schema based on mode
  const schema = mode === "create" ? createUserSchema : updateUserSchema;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "active",
      gender: "male",
    },
  });

  // Reset form when dialog opens or user changes
  useEffect(() => {
    if (isOpen) {
      if (user) {
        reset({
          ...user,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone || "",
          address: user.address || "",
          gender: user.gender,
          dateOfBirth: user.dateOfBirth
            ? new Date(user.dateOfBirth).toISOString().split("T")[0]
            : undefined,
          roleId: user.roleId,
          warehouseId: user.warehouseId,
          status: user.status,
          cccd: user.cccd || "",
          issuedAt: user.issuedAt
            ? new Date(user.issuedAt).toISOString().split("T")[0]
            : undefined,
          issuedBy: user.issuedBy || "",
        });
        if (user.avatarUrl) {
           // If we want to show existing avatar, we can rely on user.avatarUrl
           // We'll handle this in the UI
        }
      } else {
        reset({
          status: "active",
          gender: "male",
        });
        setAvatarPreview(null);
        setAvatarFile(null);
      }
    }
  }, [isOpen, user, reset]);

  // Clean up avatar preview on close
  useEffect(() => {
    if (!isOpen) {
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }
        setAvatarPreview(null);
        setAvatarFile(null);
        setShowPassword(false);
        setShowConfirmPassword(false);
    }
  }, [isOpen]);


  const selectedRoleId = watch("roleId");

  // Avatar upload handler
  const onAvatarDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ảnh phải nhỏ hơn 5MB");
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const preview = URL.createObjectURL(file);
      setAvatarPreview(preview);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onAvatarDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const removeAvatar = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  // Check if selected role needs warehouse assignment
  useEffect(() => {
    if (selectedRoleId) {
      const selectedRole = roles.find((r: any) => r.id === selectedRoleId);
      // Typically warehouse staff roles need warehouse assignment
      const needsWarehouse =
        selectedRole?.roleKey?.includes("warehouse") ||
        selectedRole?.roleName?.toLowerCase().includes("kho");
      setSelectedRoleNeedsWarehouse(!!needsWarehouse);

      // Clear warehouse if not needed
      if (!needsWarehouse) {
        setValue("warehouseId", undefined);
      }
    } else {
        setSelectedRoleNeedsWarehouse(false);
    }
  }, [selectedRoleId, roles, setValue]);



  const handleFormSubmit = async (data: any) => {
    try {
      let userId: number;
      
      if (mode === "edit" && user) {
        await updateUser.mutateAsync({
          id: user.id,
          data: data as UpdateUserFormData,
        });
        userId = user.id;
      } else {
        const result = await createUser.mutateAsync(data as CreateUserFormData);
        // Assuming result.data holds the created user object
        userId = (result as any).data.id;
      }

      if (avatarFile && userId) {
        await uploadAvatar.mutateAsync({ id: userId, file: avatarFile });
      }

      onClose();
    } catch (error) {
      console.error("Failed to save user:", error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={`!max-w-none w-[98vw] h-[95vh] flex flex-col ${contentClassName || ""}`}
      overlayClassName={overlayClassName}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {mode === "create" ? "Thêm nhân viên mới" : "Cập nhật thông tin nhân viên"}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {mode === "create" 
              ? "Điền thông tin bên dưới để tạo tài khoản nhân viên mới" 
              : "Cập nhật thông tin chi tiết cho nhân viên"}
          </p>
        </div>

      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <form id="user-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Thông tin cơ bản
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Employee Code */}
                {mode === "create" && (
                  <div>
                    <label
                      htmlFor="employeeCode"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Mã nhân viên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="employeeCode"
                      {...register("employeeCode")}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      placeholder="VD: NV001"
                    />
                    {(errors as any).employeeCode && (
                      <p className="mt-1 text-sm text-red-600">{(errors as any).employeeCode.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Chỉ cho phép chữ hoa, số và dấu gạch ngang
                    </p>
                  </div>
                )}

                {/* Full Name */}
                <div className={mode === "create" ? "" : "sm:col-span-2"}>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    {...register("fullName")}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="VD: Nguyễn Văn A"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    {...register("email")}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    {...register("phone")}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="0901234567"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label
                    htmlFor="gender"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Giới tính
                  </label>
                  <select
                    id="gender"
                    {...register("gender")}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label
                    htmlFor="dateOfBirth"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Ngày sinh
                  </label>
                  <FormDatePicker
                    name="dateOfBirth"
                    control={control}
                    label={undefined}
                    placeholder="Chọn ngày sinh"
                    className="w-full mt-1"
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
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
                  <textarea
                    id="address"
                    {...register("address")}
                    rows={2}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="Nhập địa chỉ"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>

                {/* CCCD */}
                <div>
                  <label
                    htmlFor="cccd"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    CCCD/ID
                  </label>
                  <input
                    type="text"
                    id="cccd"
                    {...register("cccd")}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="VD: 123456789012"
                  />
                  {errors.cccd && (
                    <p className="mt-1 text-sm text-red-600">{errors.cccd.message}</p>
                  )}
                </div>

                 {/* Issued At */}
                <div>
                  <label
                    htmlFor="issuedAt"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Ngày cấp CCCD
                  </label>
                  <FormDatePicker
                    name="issuedAt"
                    control={control}
                    label={undefined}
                    placeholder="Chọn ngày cấp"
                    className="w-full mt-1"
                  />
                  {errors.issuedAt && (
                    <p className="mt-1 text-sm text-red-600">{errors.issuedAt.message}</p>
                  )}
                </div>

                {/* Issued By */}
                <div>
                  <label
                    htmlFor="issuedBy"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                     Nơi cấp CCCD
                  </label>
                  <input
                    type="text"
                    id="issuedBy"
                    {...register("issuedBy")}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="VD: Công an TP HCM"
                  />
                  {errors.issuedBy && (
                    <p className="mt-1 text-sm text-red-600">{errors.issuedBy.message}</p>
                  )}
                </div>
              </div>
          </div>

          {/* Password (Create mode or Optional Edit mode) */}
          {(mode === "create" || mode === "edit") && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {mode === "create" ? "Thông tin đăng nhập" : "Đổi mật khẩu (Tùy chọn)"}
              </h3>
              {mode === "edit" && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Để trống nếu không muốn thay đổi mật khẩu
                  </p>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {mode === "create" ? "Mật khẩu" : "Mật khẩu mới"} {mode === "create" && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      {...register("password")}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      placeholder="Nhập mật khẩu"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Xác nhận mật khẩu {mode === "create" && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      {...register("confirmPassword")}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      placeholder="Nhập lại mật khẩu"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Avatar Upload */}
          <div className="space-y-4">
               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                 Ảnh đại diện
               </h3>
               <div className="grid grid-cols-1 gap-4">
                   <div>
                      {avatarPreview ? (
                        <div className="flex flex-col items-center gap-4 border rounded-lg p-4">
                          <div className="relative h-32 w-32">
                            <img
                              src={avatarPreview}
                              alt="Avatar preview"
                              className="h-full w-full rounded-lg object-cover"
                            />
                            <button
                              type="button"
                              onClick={removeAvatar}
                              disabled={isLoading}
                              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-lg hover:bg-red-600 disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {avatarFile?.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {avatarFile && `${(avatarFile.size / 1024 / 1024).toFixed(2)}MB`}
                            </p>
                          </div>
                        </div>
                      ) : user?.avatarUrl ? (
                           <div className="flex flex-col items-center gap-4 border rounded-lg p-4">
                              <div className="relative h-32 w-32">
                                <img
                                  src={user.avatarUrl}
                                  alt="Current avatar"
                                  className="h-full w-full rounded-lg object-cover"
                                />
                              </div>
                              <div
                                {...getRootProps()}
                                className="cursor-pointer text-blue-600 hover:underline text-sm"
                               >
                                 <input {...getInputProps()} disabled={isLoading} />
                                 Thay đổi ảnh
                               </div>
                           </div>
                      ) : (
                        <div
                          {...getRootProps()}
                          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition-colors ${
                            isDragActive
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
                              : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
                          } ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          <input {...getInputProps()} disabled={isLoading} />

                          <div className="flex flex-col items-center text-center">
                            <Upload className="h-12 w-12 text-gray-400" />
                            <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">
                              Nhấp hoặc kéo thả ảnh vào đây
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              PNG, JPG, WEBP tối đa 5MB
                            </p>
                          </div>
                        </div>
                      )}
                   </div>
               </div>
          </div>

          {/* Role & Warehouse */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Phân quyền & Kho làm việc
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Role */}
              <div>
                <label
                  htmlFor="roleId"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  options={[
                    { value: "", label: "Chọn vai trò" },
                    ...roles.map((r: any) => ({
                      value: String(r.id),
                      label: r.roleName,
                    })),
                  ]}
                  value={watch("roleId") === 0 ? "" : String(watch("roleId"))}
                  onChange={(value) => {
                    const val = value === "" ? 0 : Number(value);
                    setValue("roleId", val);
                  }}
                  placeholder="Tìm kiếm vai trò..."
                  isClearable={false}
                />
                {errors.roleId && (
                  <p className="mt-1 text-sm text-red-600">{errors.roleId.message}</p>
                )}
              </div>

              {/* Warehouse */}
              <div>
                <label
                  htmlFor="warehouseId"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Kho làm việc {selectedRoleNeedsWarehouse && <span className="text-red-500">*</span>}
                </label>
                 <SearchableSelect
                   options={[
                     { value: "", label: "Chọn kho" },
                     ...warehouses.map((w: any) => ({
                       value: String(w.id),
                       label: `${w.warehouseName} (${w.warehouseCode})`,
                     })),
                   ]}
                   value={watch("warehouseId") === 0 ? "" : String(watch("warehouseId"))}
                   onChange={(value) => {
                     const val = value === "" ? 0 : Number(value);
                     setValue("warehouseId", val);
                   }}
                   placeholder="Tìm kiếm kho..."
                   isClearable={false}
                 />
                {errors.warehouseId && (
                  <p className="mt-1 text-sm text-red-600">{errors.warehouseId.message}</p>
                )}
                {selectedRoleNeedsWarehouse && (
                  <p className="mt-1 text-xs text-gray-500">
                    Nhân viên kho cần được gán vào một kho cụ thể
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
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngưng hoạt động</option>
                  <option value="locked">Bị khóa</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>
          </div>


        </form>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="user-form"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading && (
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {mode === "create" ? "Tạo nhân viên" : "Cập nhật"}
            </button>
      </div>
    </Modal>
  );
}
