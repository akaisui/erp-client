"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCreateCustomer } from "@/hooks/api";
import CustomerForm from "@/app/(admin)/customers/(components)/CustomerForm";
import Button from "@/components/ui/button/Button";
import { ArrowLeft } from "lucide-react";
import type { CreateCustomerInput } from "@/lib/validations";

export default function CreateCustomerPage() {
  const router = useRouter();
  const createCustomer = useCreateCustomer();

  const handleSubmit = async (data: CreateCustomerInput | any) => {
    try {
      await createCustomer.mutateAsync(data as CreateCustomerInput);
      router.push(`/customers`);
    } catch (error) {
      console.error("Failed to create customer:", error);
    }
  };

  const handleCancel = () => {
    router.push("/customers");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tạo khách hàng mới
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Thêm khách hàng mới vào hệ thống
          </p>
        </div>
        <Button variant="outline" size="ssmm" onClick={() => router.push("/customers")}>
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </Button>
      </div>

      {/* Form */}
      <CustomerForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createCustomer.isPending}
      />
    </div>
  );
}
