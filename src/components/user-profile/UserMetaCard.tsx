"use client";
import React, { useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import { SimpleDatePicker } from "../form/SimpleDatePicker";
import Label from "../form/Label";
import Image from "next/image";
import type { User } from "@/types";

interface UserMetaCardProps {
  user: User;
  canEdit: boolean;
}

export default function UserMetaCard({ user, canEdit }: UserMetaCardProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    email: user.email,
    employeeCode: user.employeeCode,
    phone: user.phone || "",
    address: user.address || "",
    gender: user.gender || "",
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
    cccd: user.cccd || "",
    issuedAt: user.issuedAt ? new Date(user.issuedAt).toISOString().split('T')[0] : "",
    issuedBy: user.issuedBy || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    console.log("Saving changes...", formData);
    closeModal();
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <Image
                width={80}
                height={80}
                src={user.avatarUrl || "/images/user/owner.jpg"}
                alt={user.fullName}
                priority
              />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {user.fullName}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.employeeCode}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.address || "Chưa cập nhật"}
                </p>
              </div>
            </div>
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              {/* Social links removed as not in schema */}
            </div>
          </div>
          {canEdit && (
            <Button
              onClick={openModal}
              variant="success"
              size="sm"
              className="w-full lg:w-auto"
              startIcon={
                <svg
                  className="fill-current"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                    fill="currentColor"
                  />
                </svg>
              }
            >
              Chỉnh Sửa
            </Button>
          )}
        </div>
      </div>
      {canEdit && (
        <Modal isOpen={isOpen} onClose={closeModal} className="w-full max-w-[600px] max-h-[90vh] rounded-3xl bg-white p-6 dark:bg-gray-900 sm:p-8 flex flex-col overflow-y-auto">
          <form className="flex flex-col">
            <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
              Chỉnh Sửa Thông Tin Cá Nhân
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Cập nhật thông tin để giữ hồ sơ của bạn luôn cập nhật.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 mb-6 flex-1">
              <div>
                <Label>Họ Tên</Label>
                <Input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input type="text" value={formData.email} readOnly />
              </div>

              <div>
                <Label>Mã Nhân Viên</Label>
                <Input type="text" value={formData.employeeCode} readOnly />
              </div>

              <div>
                <Label>Số Điện Thoại</Label>
                <Input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>Giới Tính</Label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="">-- Chọn --</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div>
                <Label>Ngày Sinh</Label>
                <SimpleDatePicker
                  value={formData.dateOfBirth}
                  onChange={(value) => setFormData(prev => ({ ...prev, dateOfBirth: value }))}
                  placeholder="Chọn ngày sinh"
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Địa Chỉ</Label>
                <Input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>Số CCCD</Label>
                <Input
                  type="text"
                  name="cccd"
                  value={formData.cccd}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>Ngày Cấp CCCD</Label>
                <SimpleDatePicker
                  value={formData.issuedAt}
                  onChange={(value) => setFormData(prev => ({ ...prev, issuedAt: value }))}
                  placeholder="Chọn ngày cấp"
                />
              </div>

              <div className="sm:col-span-2">
                <Label>Nơi Cấp</Label>
                <Input
                  type="text"
                  name="issuedBy"
                  value={formData.issuedBy}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700 mt-auto">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Đóng
              </Button>
              <Button size="sm" variant="success" onClick={handleSave}>
                Lưu Thay Đổi
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

