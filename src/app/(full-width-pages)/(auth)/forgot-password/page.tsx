"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ChevronLeftIcon } from "@/icons";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations";
import { useForgotPassword } from "@/hooks/api";

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useForgotPassword();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPasswordMutation.mutateAsync(data.email);
      setEmailSent(true);
    } catch (error) {
      console.error("Forgot password error:", error);
    }
  };

  return (
    <div className="flex flex-1 flex-col lg:w-1/2">
      {/* Back Button */}
      <div className="mx-auto w-full max-w-md px-4 pt-10 sm:px-6">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          <span className="ml-2">Quay lại đăng nhập</span>
        </Link>
      </div>

      {/* Form Container */}
      <div className="flex flex-1 flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          {!emailSent ? (
            <>
              {/* Header */}
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <svg
                    className="h-8 w-8 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                  Quên mật khẩu?
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    {...register("email")}
                    error={errors.email?.message}
                    disabled={forgotPasswordMutation.isPending}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={forgotPasswordMutation.isPending}
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending
                    ? "Đang gửi..."
                    : "Gửi email khôi phục"}
                </Button>
              </form>
            </>
          ) : (
            <>
              {/* Success Message */}
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <svg
                    className="h-8 w-8 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                  Kiểm tra email của bạn
                </h2>
                <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                  Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến{" "}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getValues("email")}
                  </span>
                </p>

                <div className="space-y-3">
                  <Link href="/login">
                    <Button variant="primary" className="w-full">
                      Quay lại đăng nhập
                    </Button>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setEmailSent(false)}
                    className="w-full text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    Chưa nhận được email? Gửi lại
                  </button>
                </div>
              </div>

              {/* Help Text */}
              <div className="mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Lưu ý:</strong> Nếu không thấy email trong hộp thư đến, vui
                  lòng kiểm tra thư mục spam hoặc rác. Email có thể mất vài phút để đến.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
