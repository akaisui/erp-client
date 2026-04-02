"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
// SỬA: Import từ cùng thư mục
import CustomerForm from "./CustomerForm"; 
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/api";
import { Customer } from "@/types";
import { CreateCustomerInput, UpdateCustomerInput } from "@/lib/validations";
import { toast } from "react-hot-toast";

interface CustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null; // Nếu null là mode Create, có dữ liệu là mode Edit
}

export function CustomerDialog({
  isOpen,
  onClose,
  customer,
}: CustomerDialogProps) {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const isEdit = !!customer;
  const isLoading = createCustomer.isPending || updateCustomer.isPending;

  const handleSubmit = async (data: CreateCustomerInput | UpdateCustomerInput) => {
    try {
      if (isEdit && customer) {
        await updateCustomer.mutateAsync({
          id: customer.id,
          data: data as UpdateCustomerInput,
        });
        toast.success("Cập nhật khách hàng thành công");
      } else {
        await createCustomer.mutateAsync(data as CreateCustomerInput);
        toast.success("Thêm khách hàng mới thành công");
      }
      onClose();
    } catch (error: any) {
      console.error("Failed to save customer:", error);
      // Toast lỗi thường được handle trong hooks, nếu chưa thì uncomment dòng dưới:
      // toast.error(error?.message || "Có lỗi xảy ra");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      // Điều chỉnh kích thước modal phù hợp với form dài
      className="!max-w-none w-[98vw] h-[95vh] flex flex-col p-0 overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEdit ? "Cập nhật thông tin khách hàng" : "Thêm khách hàng mới"}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isEdit
              ? `Cập nhật thông tin cho khách hàng: ${customer.customerName}`
              : "Điền thông tin bên dưới để tạo khách hàng mới"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-6">
        <CustomerForm
          customer={customer || undefined}
          isEdit={isEdit}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={isLoading}
          hideActions={true}
          formId="customer-form"
        />
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
          form="customer-form"
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
          {isEdit ? "Cập nhật" : "Tạo khách hàng"}
        </button>
      </div>
    </Modal>
  );
}