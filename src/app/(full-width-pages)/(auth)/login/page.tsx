"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EyeIcon, EyeCloseIcon } from "@/icons";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import OTPInput from "@/components/form/input/OTPInput";
import Checkbox from "@/components/form/input/Checkbox";
import Label from "@/components/form/Label";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { useLogin, useVerifyOTP, useResendOTP } from "@/hooks/api";
import type { OTPRequiredResponse } from "@/types";

function LoginContent() {
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [otpRequired, setOTPRequired] = useState(false);
  const [otpEmail, setOTPEmail] = useState("");
  const [otpCode, setOTPCode] = useState("");
  const [otpExpiresIn, setOTPExpiresIn] = useState(300);
  const [timeLeft, setTimeLeft] = useState(300);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember_me: false,
    },
  });

  const loginMutation = useLogin();
  const verifyOTPMutation = useVerifyOTP();
  const resendOTPMutation = useResendOTP();

  useEffect(() => {
    if (!otpRequired) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpRequired, otpExpiresIn]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await loginMutation.mutateAsync(data);
      if ("requireOTP" in result && result.requireOTP) {
        const otpData = result as unknown as OTPRequiredResponse;
        setOTPRequired(true);
        setOTPEmail(otpData.email);
        setOTPExpiresIn(otpData.expiresIn);
        setTimeLeft(otpData.expiresIn);
        if (otpData.code) {
          setOTPCode(otpData.code);
          console.log("🔐 DEV MODE - OTP Code:", otpData.code);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) return;
    try {
      await verifyOTPMutation.mutateAsync({ email: otpEmail, code: otpCode });
    } catch (error) {
      console.error("OTP verification error:", error);
    }
  };

  const handleResendOTP = async () => {
    try {
      const result = await resendOTPMutation.mutateAsync(otpEmail);
      setOTPExpiresIn((result as any).expiresIn);
      setTimeLeft((result as any).expiresIn);
      setOTPCode("");
    } catch (error) {
      console.error("Resend OTP error:", error);
    }
  };

  const handleBackToLogin = () => {
    setOTPRequired(false);
    setOTPEmail("");
    setOTPCode("");
    setTimeLeft(300);
  };

  return (
    <div className="flex flex-1 flex-col lg:w-1/2">
      <div className="flex flex-1 flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              {otpRequired ? "Xác thực OTP" : "Đăng nhập"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {otpRequired
                ? `Nhập mã xác thực đã được gửi đến ${otpEmail}`
                : "Nhập email và mật khẩu để đăng nhập vào hệ thống"}
            </p>
          </div>

          {!otpRequired ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input id="email" type="email" placeholder="user@example.com" {...register("email")} error={errors.email?.message} disabled={loginMutation.isPending} />
              </div>
              <div>
                <Label htmlFor="password">Mật khẩu <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" {...register("password")} error={errors.password?.message} disabled={loginMutation.isPending} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    {showPassword ? <EyeCloseIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Checkbox id="remember_me" label="Ghi nhớ đăng nhập" {...register("remember_me")} />
                <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">Quên mật khẩu?</Link>
              </div>
              <Button type="submit" variant="primary" className="w-full" isLoading={loginMutation.isPending} disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
              <div className="mt-8 rounded-lg bg-blue-50 p-4 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Tài khoản dùng thử (Demo)</p>
                  <div className="flex flex-col text-sm text-blue-700 dark:text-blue-400">
                    <p>Email: <span className="font-medium text-gray-900 dark:text-white">nhoangkha03@gmail.com</span></p>
                    <p>Mật khẩu: <span className="font-medium text-gray-900 dark:text-white">admin123</span></p>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <Label htmlFor="otp">Mã xác thực (OTP) <span className="text-red-500">*</span></Label>
                <OTPInput length={6} value={otpCode} onChange={setOTPCode} disabled={verifyOTPMutation.isPending || timeLeft === 0} autoFocus />
              </div>
              <div className="text-center">
                {timeLeft > 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mã sẽ hết hạn sau: <span className="font-semibold text-brand-600 dark:text-brand-400">{formatTime(timeLeft)}</span></p>
                ) : (
                  <p className="text-sm text-error-600 dark:text-error-400 font-medium">Mã xác thực đã hết hạn</p>
                )}
              </div>
              <Button type="button" variant="primary" className="w-full" onClick={handleVerifyOTP} isLoading={verifyOTPMutation.isPending} disabled={verifyOTPMutation.isPending || otpCode.length !== 6 || timeLeft === 0}>
                {verifyOTPMutation.isPending ? "Đang xác thực..." : "Xác thực"}
              </Button>
              <div className="text-center space-y-2">
                <button type="button" onClick={handleResendOTP} disabled={resendOTPMutation.isPending || timeLeft > 240} className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed">
                  {resendOTPMutation.isPending ? "Đang gửi..." : "Gửi lại mã xác thực"}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400">{timeLeft > 240 && "Vui lòng đợi 1 phút trước khi gửi lại"}</p>
              </div>
              <button type="button" onClick={handleBackToLogin} className="w-full text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                ← Quay lại đăng nhập
              </button>
            </div>
          )}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Liên hệ quản trị viên nếu bạn gặp vấn đề đăng nhập</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
