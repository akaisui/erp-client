"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores";
import api from "@/lib/axios";

interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
    expiresIn: number;
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const authStore = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Bước 1: Kiểm tra xem bạn đã được xác thực trong phiên hiện tại chưa.
        if (useAuthStore.getState().token) {
          setIsInitialized(true);
          setIsLoading(false);
          return;
        }

        // Bước 2: Thử khôi phục phiên từ cookie HttpOnly
        const refreshResponse = await api.post("/auth/refresh-token", {}) as unknown as RefreshResponse;

        if (refreshResponse?.data.accessToken) {
          // Token được khôi phục từ cookie
          authStore.setToken(refreshResponse.data.accessToken);

          // Bước 3: Lấy thông tin và quyền của người dùng
          // Điều này đảm bảo chúng ta luôn có các quyền mới nhất từ ​​cơ sở dữ liệu.
          const meResponse = await api.get("/auth/me");
          if (meResponse) {
            authStore.setUser(meResponse.data);
          }

          setIsInitialized(true);
        }
      } catch (error) {
        // Không có refreshToken hợp lệ trong cookie.
        // Người dùng nên đăng nhập
        authStore.logout();

        // Chỉ chuyển hướng nếu truy cập vào tuyến đường được bảo vệ.
        if (
          !pathname.includes("/login") &&
          !pathname.includes("/forgot-password") &&
          !pathname.includes("/signup")
        ) {
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        }

        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []); // Chỉ chạy một lần khi mount

  // Kiểm tra xem route hiện tại có phải là route công cộng (không cần xác thực) hay không.
  const isPublicRoute = 
    pathname?.includes("/login") ||
    pathname?.includes("/forgot-password") ||
    pathname?.includes("/signup");

  // Chỉ hiển thị màn hình loading cho các route được bảo vệ trong quá trình khởi tạo.
  // Các route công cộng cần được hiện ngay lập tức.
  if (isLoading && !isPublicRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Đang tải...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
