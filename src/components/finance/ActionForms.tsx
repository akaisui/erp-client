"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/button/Button"; 
import {
  sendDebtEmailSchema, SendDebtEmailForm
} from "@/lib/validations/debt-reconciliation.schema";

// =================================================================
// FORM GỬI EMAIL (SEND EMAIL)
// =================================================================
interface EmailFormProps {
  onSubmit: (data: SendDebtEmailForm) => void;
  onCancel: () => void;
  isLoading: boolean;
  defaultEmail?: string;
  defaultName?: string;
}

export function SendEmailForm({ onSubmit, onCancel, isLoading, defaultEmail, defaultName }: EmailFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<SendDebtEmailForm>({
    resolver: zodResolver(sendDebtEmailSchema),
    defaultValues: { 
        recipientEmail: defaultEmail || "", 
        recipientName: defaultName || "" 
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tên người nhận <span className="text-red-500">*</span>
          </label>
          <input 
            {...register("recipientName")} 
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white" 
          />
          {errors.recipientName && <p className="text-xs text-red-500 mt-1">{errors.recipientName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email nhận <span className="text-red-500">*</span>
          </label>
          <input 
            {...register("recipientEmail")} 
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white" 
          />
          {errors.recipientEmail && <p className="text-xs text-red-500 mt-1">{errors.recipientEmail.message}</p>}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lời nhắn</label>
        <textarea 
            {...register("message")} 
            rows={4} 
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white" 
            placeholder="Kính gửi Quý khách, xin gửi bảng đối chiếu công nợ..." 
        />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Hủy
        </Button>
        <Button type="submit" isLoading={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
            Gửi Email
        </Button>
      </div>
    </form>
  );
}