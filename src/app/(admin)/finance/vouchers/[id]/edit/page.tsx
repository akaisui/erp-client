"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { usePaymentVoucher, useUpdatePaymentVoucher } from "@/hooks/api";
import VoucherForm from "@/components/finance/VoucherForm";
import Button from "@/components/ui/button/Button";
import type { ApiResponse, PaymentVoucher, UpdatePaymentVoucherDto } from "@/types";
import { ArrowLeft } from "lucide-react";


export default function EditVoucherPage() {
    const router = useRouter();
    const params = useParams()
    const voucherId = parseInt(params.id as string)
    const { data, isLoading } = usePaymentVoucher(voucherId);
    const dataWrapper = data as unknown as ApiResponse<PaymentVoucher>;
    const voucher = dataWrapper?.data;
    const updateVoucher = useUpdatePaymentVoucher()

    const handleSubmit = async (id: number, data: UpdatePaymentVoucherDto) => {
        try {
        await updateVoucher.mutateAsync({id ,data});
        router.push("/finance/vouchers");
        } catch (error) {}
    };

    const handleCancel = () => {
        router.push("/finance/vouchers");
    };

    return (
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Chỉnh Sửa Phiếu Chi
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Chỉnh sửa phiếu chi tiền
              </p>
            </div>
            <Button variant="outline" size="ssmm" onClick={() => router.push("/finance/vouchers")}>
              <ArrowLeft className="h-5 w-5" />
              Quay lại
            </Button>
        </div>

        {/* Form */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <VoucherForm
                initialData={voucher}
                onSubmit={(Formdata) => handleSubmit(voucherId, Formdata)}
                onCancel={handleCancel}
                loading={updateVoucher.isPending}
                isEdit={true}
            />
        </div>

        {/* Info Box */}
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <h3 className="font-semibold text-red-900 dark:text-red-300">
                Lưu ý quan trọng
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-red-800 dark:text-red-400">
                <li>• Phiếu chi sau khi tạo cần phê duyệt mới có hiệu lực</li>
                <li>• Khi phê duyệt, công nợ nhà cung cấp sẽ được cập nhật tự động (nếu có)</li>
                <li>
                • Nếu phương thức thanh toán là tiền mặt, quỹ tiền mặt sẽ được cập nhật
                </li>
                <li>• Chỉ có thể xóa phiếu chi chưa được phê duyệt</li>
            </ul>
        </div>
        </div>
    );
}
