"use client";

import React, { useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import ReceiptForm from "@/components/finance/ReceiptForm";
import { useCreatePaymentReceipt, useUpdatePaymentReceipt, usePaymentReceipt } from "@/hooks/api";
import { PaymentReceiptFormData } from "@/lib/validations";

interface ReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  receiptId?: number | null; // If present, edit mode
}

export function ReceiptDialog({ isOpen, onClose, receiptId }: ReceiptDialogProps) {
  const isEdit = !!receiptId;
  const createReceipt = useCreatePaymentReceipt();
  const updateReceipt = useUpdatePaymentReceipt();
  
  // Fetch receipt detail if in edit mode
  const { data: receiptResponse, isLoading: isLoadingDetail } = usePaymentReceipt(receiptId!, isEdit && isOpen);
  const receiptData = receiptResponse?.data;

  const handleSubmit = async (data: PaymentReceiptFormData) => {
    try {
      if (isEdit && receiptId) {
        await updateReceipt.mutateAsync({ id: receiptId, data });
      } else {
        await createReceipt.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error(error);
    }
  };
  
  // Map API response to form data
  const initialData = receiptData ? {
      receiptType: receiptData.receiptType,
      customerId: receiptData.customerRef?.id, // Note: backend might return customerRef object
      orderId: receiptData.order?.id,
      amount: receiptData.amount,
      paymentMethod: receiptData.paymentMethod,
      bankName: receiptData.bankName,
      transactionReference: receiptData.transactionReference,
      receiptDate: receiptData.receiptDate,
      notes: receiptData.notes,
  } : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl p-0 overflow-hidden rounded-xl flex flex-col max-h-[90vh]"
      showCloseButton={true}
    >
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {isEdit ? "Cập nhật phiếu thu" : "Lập phiếu thu mới"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isEdit ? "Điều chỉnh thông tin phiếu thu" : "Nhập thông tin chi tiết cho phiếu thu mới"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
         {isLoadingDetail && isEdit ? (
             <div className="flex justify-center py-8">
                 <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
             </div>
         ) : (
            <ReceiptForm
                initialData={initialData}
                onSubmit={handleSubmit}
                onCancel={onClose}
                loading={createReceipt.isPending || updateReceipt.isPending}
                isEdit={isEdit}
            />
         )}
      </div>
    </Modal>
  );
}
