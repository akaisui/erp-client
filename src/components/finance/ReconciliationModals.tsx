"use client";

import React, { useState } from "react";
import { useDebtReconciliationStore } from "@/stores/debtReconciliationStore"; // Chỉ dùng cho Email Modal
import { 
  useSyncSnap, 
  useSyncFull, 
  useSendReconciliationEmail 
} from "@/hooks/api/useDebtReconciliation";
import { Modal } from "@/components/ui/modal"; 
import ReconciliationForm from "./ReconciliationForm"; 
import { Mail, Info, RefreshCw } from "lucide-react";
import Button from "@/components/ui/button/Button";
import { useForm } from "react-hook-form";
import { DebtType } from "@/types/debt-reconciliation.types";

const TABS = [
  { id: 'SNAP', label: '⚡ Cập nhật nhanh' },
  { id: 'FULL', label: '🛠️ Tính lại toàn bộ' }
];

// ✅ Nhận props từ cha để điều khiển Modal Create
interface ModalsProps {
    isCreateOpen: boolean;
    closeCreate: () => void;
}

export default function DebtReconciliationModals({ isCreateOpen, closeCreate }: ModalsProps) {
  const store = useDebtReconciliationStore(); // Store vẫn dùng cho Email Modal
  const [activeTab, setActiveTab] = useState('SNAP');

  const syncSnapMutation = useSyncSnap();
  const syncFullMutation = useSyncFull();
  const emailMutation = useSendReconciliationEmail();

  const loading = activeTab === 'SNAP' ? syncSnapMutation.isPending : syncFullMutation.isPending;

  // Hàm xử lý Sync
  const handleSyncSubmit = async (data: any) => {
    try {
        if (activeTab === 'SNAP') {
            await syncSnapMutation.mutateAsync(data);
        } else {
            if(!confirm("Bạn có chắc muốn quét lại toàn bộ lịch sử? Quá trình này sẽ chạy ngầm.")) return;
            await syncFullMutation.mutateAsync(data);
        }
        closeCreate(); // Đóng modal sau khi thành công
    } catch (error) {
        console.error("Sync failed", error);
    }
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 1. MODAL SYNC (Create/Update) - ĐIỀU KHIỂN BỞI PROPS      */}
      {/* ========================================================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={closeCreate}
        className="max-w-xl p-0 overflow-hidden rounded-xl flex flex-col max-h-[90vh]"
        showCloseButton={true}
      >
        {/* Header - Match UserDialog */}
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Cập nhật công nợ
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {activeTab === 'SNAP' 
              ? "Cập nhật nhanh số dư năm nay cho đối tác cụ thể" 
              : "Quét lại toàn bộ lịch sử giao dịch để sửa lỗi sai lệch"}
          </p>
          
          <div className="flex gap-6 mt-4">
             {TABS.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                   activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                 }`}
               >
                 {tab.label}
               </button>
             ))}
          </div>
        </div>

        {/* Body - Match UserDialog */}
        <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
          <div className={`mb-4 p-3 rounded text-sm flex gap-2 ${
             activeTab === 'SNAP' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
          }`}>
             <Info className="h-5 w-5 shrink-0" />
             <span>
                 {activeTab === 'SNAP' 
                   ? "Dùng khi vừa tạo đơn hàng hoặc thu tiền xong. Hệ thống sẽ tính lại số dư năm nay." 
                   : "Dùng khi thấy số liệu sai lệch. Hệ thống sẽ quét lại toàn bộ lịch sử từ quá khứ (Chạy ngầm)."}
             </span>
          </div>

          <ReconciliationForm
            formId="sync-debt-form"
            mode={activeTab as 'SNAP' | 'FULL'}
            onCancel={closeCreate}
            loading={loading}
            onSubmit={handleSyncSubmit}
            hideFooter={true}
          />
        </div>

        {/* Footer - Match UserDialog */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button
              type="button"
              onClick={closeCreate}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="sync-debt-form"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
              {activeTab === 'SNAP' ? "Cập nhật ngay" : "Gửi lệnh sửa lỗi"}
            </button>
        </div>
      </Modal>

      {/* ========================================================= */}
      {/* 2. MODAL GỬI EMAIL - VẪN DÙNG STORE (VÌ GỌI TỪ TABLE ROW) */}
      {/* ========================================================= */}
      {/* <Modal
        isOpen={store.isEmailModalOpen}
        onClose={store.closeEmailModal}
        className="max-w-lg p-0 overflow-hidden rounded-xl"
        showCloseButton={true}
      >
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Gửi Email thông báo
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
             Gửi tới: <span className="font-semibold">{store.selectedName}</span>
          </p>
        </div>

        <div className="p-6">
           <SendEmailForm
                isLoading={emailMutation.isPending}
                onCancel={store.closeEmailModal}
                defaultName={store.selectedName}
                defaultEmail={store.selectedEmail} 
                onSubmit={async (formData) => {
                    if (store.selectedId && store.selectedType) {
                        await emailMutation.mutateAsync({ 
                            id: store.selectedId, 
                            data: {
                                type: store.selectedType as DebtType,
                                year: formData.isReport ? new Date().getFullYear() : undefined,
                                message: formData.message,
                                customEmail: formData.customEmail
                            }
                        });
                        store.closeEmailModal();
                    }
                }}
            />
        </div>
      </Modal> */}
    </>
  );
}

// ... (Giữ nguyên component SendEmailForm bên dưới) ...
interface SendEmailFormProps {
    defaultEmail: string;
    defaultName: string;
    isLoading: boolean;
    onCancel: () => void;
    onSubmit: (data: any) => void;
}

export function SendEmailForm({ defaultEmail, defaultName, isLoading, onCancel, onSubmit }: SendEmailFormProps) {
    // ... (Code form giữ nguyên như cũ) ...
    // Copy lại đoạn useForm và return form ở đây
    const { register, handleSubmit, watch, setValue } = useForm({
        defaultValues: {
            isReport: false,
            customEmail: defaultEmail,
            message: `Kính gửi ${defaultName},\n\nXin vui lòng kiểm tra thông tin công nợ đính kèm.\nTrân trọng.`
        }
    });

    const isReport = watch("isReport");

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-md w-full hover:bg-gray-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input type="radio" value="false" {...register("isReport")} onChange={() => setValue("isReport", false)} checked={!isReport} />
                    <span className="text-sm font-medium">🔔 Nhắc nợ hiện tại</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-md w-full hover:bg-gray-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input type="radio" value="true" {...register("isReport")} onChange={() => setValue("isReport", true)} checked={isReport} />
                    <span className="text-sm font-medium">📄 Đối chiếu năm</span>
                </label>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Email nhận</label>
                <input 
                    {...register("customEmail")} 
                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Nhập email nếu muốn thay đổi..."
                />
                <p className="text-xs text-gray-400 mt-1">Để trống nếu muốn dùng email mặc định của khách.</p>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Lời nhắn</label>
                <textarea 
                    {...register("message")} 
                    rows={4} 
                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Hủy</Button>
                <Button type="submit" isLoading={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Mail className="h-4 w-4 mr-2" /> Gửi Ngay
                </Button>
            </div>
        </form>
    );
}