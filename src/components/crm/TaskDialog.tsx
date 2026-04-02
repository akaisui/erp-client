"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { CreateTaskDto, CrmTask, TaskStatus } from "@/types/crm.types";
// Import hook lấy khách hàng (Đảm bảo bạn đã có hook này trong dự án)
import { useCustomers } from "@/hooks/api/useCustomers"; 

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskDto | Partial<CrmTask>) => void;
  initialData?: CrmTask | null;
  isSubmitting?: boolean;
}

type TaskFormData = CreateTaskDto & { status?: TaskStatus };

const TaskDialog: React.FC<TaskDialogProps> = ({
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
    formState: { errors },
  } = useForm<TaskFormData>({
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      type: "call",
      customerId: 0,
      status: "pending",
    },
  });

  // --- LẤY DỮ LIỆU KHÁCH HÀNG TỪ API ---
  const { data: customersResponse, isLoading: isLoadingCustomers } = useCustomers({
    page: 1,
    limit: 100, // Lấy 100 khách hàng để chọn (có thể tối ưu bằng search sau)
  });
  
  // Cast dữ liệu an toàn
  const customers = customersResponse?.data || []; 

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setValue("title", initialData.title);
        setValue("description", initialData.description);
        setValue("priority", initialData.priority);
        setValue("status", initialData.status);
        setValue("type", initialData.type);
        setValue("customerId", initialData.customerId);
        
        if (initialData.dueDate) {
            const date = new Date(initialData.dueDate);
            // Fix múi giờ cho input datetime-local
            // Tạo chuỗi YYYY-MM-DDThh:mm theo giờ địa phương
            const localIsoString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
            setValue("dueDate", localIsoString);
        }
      } else {
        reset({
          title: "",
          description: "",
          priority: "medium",
          type: "call",
          customerId: 0,
          status: "pending",
          dueDate: "",
        });
      }
    }
  }, [initialData, setValue, reset, isOpen]);

  const handleFormSubmit = (data: TaskFormData) => {
    let formattedDueDate = data.dueDate;
    if (data.dueDate) {
        // Chuyển về ISO chuẩn cho BE
        const dateObj = new Date(data.dueDate); 
        formattedDueDate = dateObj.toISOString(); 
    }

    const formattedData = {
        ...data,
        customerId: Number(data.customerId), // Convert string -> number
        dueDate: formattedDueDate,
    };
    
    onSubmit(formattedData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="!max-w-2xl w-full h-auto flex flex-col p-0 overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initialData ? "Cập nhật nhiệm vụ" : "Tạo nhiệm vụ CSKH mới"}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {initialData ? "Chỉnh sửa thông tin nhiệm vụ hiện tại" : "Lên lịch chăm sóc khách hàng"}
          </p>
        </div>
      </div>

      <div className="p-6 bg-gray-50 dark:bg-gray-900/50 overflow-y-auto max-h-[70vh]">
        <form id="task-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tiêu đề nhiệm vụ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Ví dụ: Gọi điện xác nhận..."
              {...register("title", { required: "Vui lòng nhập tiêu đề" })}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Loại nhiệm vụ <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                {...register("type")}
              >
                <option value="call">Gọi điện (Call)</option>
                <option value="email">Gửi Email</option>
                <option value="meeting">Gặp mặt (Meeting)</option>
                <option value="other">Khác</option>
              </select>
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
              </select>
            </div>
          </div>

          {/* Customer & DueDate */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Khách hàng <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                {...register("customerId", { required: "Vui lòng chọn khách hàng" })}
                disabled={isLoadingCustomers}
              >
                <option value="">-- Chọn khách hàng --</option>
                {/* --- RENDER KHÁCH HÀNG THẬT --- */}
                {customers.map((customer: any) => (
                    <option key={customer.id} value={customer.id}>
                        {customer.customerCode} - {customer.customerName}
                    </option>
                ))}
              </select>
              {errors.customerId && (
                <p className="mt-1 text-xs text-red-500">{errors.customerId.message}</p>
              )}
              {isLoadingCustomers && <p className="text-xs text-gray-400 mt-1">Đang tải danh sách...</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Hạn hoàn thành <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                {...register("dueDate", { required: "Vui lòng chọn hạn hoàn thành" })}
              />
              {errors.dueDate && (
                <p className="mt-1 text-xs text-red-500">{errors.dueDate.message}</p>
              )}
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
                <option value="pending">Chờ xử lý</option>
                <option value="in_progress">Đang thực hiện</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Hủy bỏ</option>
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
              placeholder="Nội dung công việc..."
              rows={3}
              {...register("description")}
            />
          </div>
        </form>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
        <Button variant="outline" onClick={onClose} type="button" disabled={isSubmitting}>
          Hủy bỏ
        </Button>
        <Button variant="primary" type="submit" form="task-form" disabled={isSubmitting}>
          {isSubmitting ? "Đang xử lý..." : initialData ? "Cập nhật" : "Tạo mới"}
        </Button>
      </div>
    </Modal>
  );
};

export default TaskDialog;