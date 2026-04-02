"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreatePaymentReceipt } from "@/hooks/api";
import ReceiptForm from "@/components/finance/ReceiptForm";
import Button from "@/components/ui/button/Button";
import { ArrowLeft } from "lucide-react";
import { type PaymentReceiptFormData } from "@/lib/validations";

export default function CreateReceiptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createReceipt = useCreatePaymentReceipt();

  const customerId = searchParams.get("customer_id");
  
  const initialData = {
    receiptType: "sales" as const,
    customerId: customerId ? Number(customerId) : undefined,
    paymentMethod: "cash" as const,
  };

  const handleSubmit = async (data: PaymentReceiptFormData) => {
    try {
      await createReceipt.mutateAsync(data);
      router.push("/finance/receipts");
    } catch (error) {
      console.error("Failed to create receipt:", error);
    }
  };

  const handleCancel = () => {
    router.push("/finance/receipts");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tạo Phiếu Thu
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tạo phiếu thu tiền từ khách hàng
          </p>
        </div>
        <Button variant="outline" size="ssmm" onClick={() => router.push("/finance/receipts")}>
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </Button>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <ReceiptForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={createReceipt.isPending}
        />
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300">
          Lưu ý quan trọng
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-400">
          <li>• Phiếu thu sau khi tạo cần phê duyệt mới có hiệu lực</li>
          <li>• Khi phê duyệt, công nợ khách hàng sẽ được cập nhật tự động</li>
          <li>
            • Nếu liên kết với đơn hàng, số tiền đã thanh toán của đơn hàng sẽ được
            cập nhật
          </li>
          <li>• Chỉ có thể xóa phiếu thu chưa được phê duyệt</li>
        </ul>
      </div>
    </div>
  );
}
