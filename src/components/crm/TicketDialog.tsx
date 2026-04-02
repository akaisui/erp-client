"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import SearchableSelect from "@/components/ui/SearchableSelect"; // Giả sử component này đã hoạt động tốt
import { useCustomers } from "@/hooks/api/useCustomers";
import { Ticket, CreateTicketDto, TicketStatus } from "@/types/crm.types";

interface TicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTicketDto | Partial<Ticket>) => void;
  initialData?: Ticket | null;
  isSubmitting?: boolean;
}

// Định nghĩa form data bao gồm cả status (cho trường hợp edit)
type TicketFormData = CreateTicketDto & { status?: TicketStatus };

const TicketDialog: React.FC<TicketDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control, // Cần control để dùng với SearchableSelect
    formState: { errors },
  } = useForm<TicketFormData>({
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      status: "open",
      customerId: 0,
    },
  });

  // Fetch customers for dropdown
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({
    page: 1,
    limit: 100, // Lấy nhiều hơn chút để hiển thị
    status: 'active'
  });

  const customerOptions =
    customersData?.data?.map((c) => ({
      value: c.id.toString(), // SearchableSelect thường dùng value là string
      label: `${c.customerCode} - ${c.customerName}`,
    })) || [];

  // Reset form khi mở dialog hoặc thay đổi dữ liệu
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setValue("title", initialData.title);
        setValue("description", initialData.description);
        setValue("priority", initialData.priority);
        setValue("status", initialData.status);
        setValue("customerId", initialData.customerId);
        setValue("assignedToId", initialData.assignedToId);
      } else {
        reset({
          title: "",
          description: "",
          priority: "medium",
          status: "open",
          customerId: undefined,
          assignedToId: undefined,
        });
      }
    }
  }, [initialData, reset, isOpen, setValue]);

  const handleFormSubmit = (data: TicketFormData) => {
    // Đảm bảo customerId là số
    const formattedData = {
        ...data,
        customerId: Number(data.customerId),
    };
    onSubmit(formattedData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="!max-w-2xl w-full h-auto flex flex-col p-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initialData ? "Cập nhật phiếu hỗ trợ" : "Tạo phiếu hỗ trợ mới"}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {initialData ? `Mã phiếu: ${initialData.code}` : "Tiếp nhận yêu cầu hỗ trợ từ khách hàng"}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 bg-gray-50 dark:bg-gray-900/50 overflow-y-auto max-h-[75vh]">
        <form id="ticket-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Ví dụ: Lỗi đăng nhập, Yêu cầu báo giá..."
              {...register("title", { required: "Vui lòng nhập tiêu đề" })}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Customer & Priority */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Customer Select - Using Controller */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Khách hàng <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name="customerId"
                rules={{ required: "Vui lòng chọn khách hàng" }}
                render={({ field: { onChange, value } }) => (
                  <SearchableSelect
                    options={customerOptions}
                    value={value ? String(value) : ""}
                    onChange={(val) => onChange(Number(val))}
                    placeholder="Chọn khách hàng..."
                    isLoading={isLoadingCustomers}
                    // Nếu đang edit thì có thể disable nếu không muốn cho đổi khách
                    // isDisabled={!!initialData} 
                  />
                )}
              />
              {errors.customerId && (
                <p className="mt-1 text-xs text-red-500">{errors.customerId.message}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Độ ưu tiên
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                {...register("priority")}
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
            </div>
          </div>

          {/* Status (Only for Edit) */}
          {initialData && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Trạng thái
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                {...register("status")}
              >
                <option value="open">Mới (Open)</option>
                <option value="in_progress">Đang xử lý (In Progress)</option>
                <option value="resolved">Đã giải quyết (Resolved)</option>
                <option value="closed">Đóng (Closed)</option>
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Mô tả chi tiết
            </label>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Mô tả chi tiết vấn đề khách hàng gặp phải..."
              rows={5}
              {...register("description")}
            />
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
        <Button variant="outline" onClick={onClose} type="button" disabled={isSubmitting}>
          Hủy bỏ
        </Button>
        <Button variant="primary" type="submit" form="ticket-form" disabled={isSubmitting}>
          {isSubmitting ? "Đang xử lý..." : initialData ? "Cập nhật" : "Tạo phiếu"}
        </Button>
      </div>
    </Modal>
  );
};

export default TicketDialog;