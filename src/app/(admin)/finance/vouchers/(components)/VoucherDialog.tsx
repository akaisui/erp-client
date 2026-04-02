"use client";

import React, { useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import VoucherForm from "@/components/finance/VoucherForm";
import { useCreatePaymentVoucher, useUpdatePaymentVoucher, usePaymentVoucher } from "@/hooks/api";
import { PaymentVoucherFormData } from "@/lib/validations";

interface VoucherDialogProps {
  isOpen: boolean;
  onClose: () => void;
  voucherId?: number | null; // If present, edit mode
}

export function VoucherDialog({ isOpen, onClose, voucherId }: VoucherDialogProps) {
  const isEdit = !!voucherId;
  const createVoucher = useCreatePaymentVoucher();
  const updateVoucher = useUpdatePaymentVoucher();
  
  // Fetch voucher detail if in edit mode
  const { data: voucherResponse, isLoading: isLoadingDetail } = usePaymentVoucher(voucherId!, isEdit && isOpen);
  const voucherData = voucherResponse?.data;

  const handleSubmit = async (data: PaymentVoucherFormData) => {
    try {
      if (isEdit && voucherId) {
        await updateVoucher.mutateAsync({ id: voucherId, data });
      } else {
        await createVoucher.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      console.error(error);
    }
  };
  
  // Map API response to form data
  const initialData = voucherData ? {
      voucherType: voucherData.voucherType,
      supplierId: voucherData.supplier?.id,
      expenseAccount: voucherData.expenseAccount,
      amount: voucherData.amount,
      paymentMethod: voucherData.paymentMethod,
      bankName: voucherData.bankName,
      paymentDate: voucherData.paymentDate,
      notes: voucherData.notes,
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
          {isEdit ? "Cập nhật phiếu chi" : "Lập phiếu chi mới"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {isEdit ? "Điều chỉnh thông tin phiếu chi" : "Nhập thông tin chi tiết cho phiếu chi mới"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
         {isLoadingDetail && isEdit ? (
             <div className="flex justify-center py-8">
                 <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
             </div>
         ) : (
            <VoucherForm
                initialData={initialData}
                onSubmit={handleSubmit}
                onCancel={onClose}
                loading={createVoucher.isPending || updateVoucher.isPending}
                isEdit={isEdit}
            />
         )}
      </div>
    </Modal>
  );
}
