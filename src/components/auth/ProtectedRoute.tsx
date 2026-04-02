"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requireAll?: boolean; // true = cần tất cả permissions, false = cần ít nhất 1 permission
  fallback?: React.ReactNode;
}

/**
 * ProtectedRoute Component
 * Wrapper component để protect routes yêu cầu authentication và permissions
 *
 * @example
 * <ProtectedRoute requiredPermissions={['view_products']}>
 *   <ProductsPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  requiredPermissions,
  requireAll = false,
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, hasAnyPermission, hasAllPermissions, user } = useAuthStore();

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Check permissions nếu có yêu cầu
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requireAll
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);

      if (!hasPermission) {
        // Redirect về dashboard hoặc 403 page
        router.push("/403");
      }
    }
  }, [
    isAuthenticated,
    requiredPermissions,
    requireAll,
    hasAnyPermission,
    hasAllPermissions,
    router,
  ]);

  // Show loading hoặc fallback khi đang check auth
  if (!isAuthenticated) {
    return fallback || <LoadingScreen />;
  }

  // Check permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermission = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);

    if (!hasPermission) {
      return fallback || <UnauthorizedScreen />;
    }
  }

  return <>{children}</>;
}

/**
 * Loading Screen Component
 */
function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Đang tải...</p>
      </div>
    </div>
  );
}

/**
 * Unauthorized Screen Component
 */
function UnauthorizedScreen() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg
            className="h-10 w-10 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Không có quyền truy cập
        </h1>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn
          nghĩ đây là lỗi.
        </p>
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          Quay về trang chủ
        </button>
      </div>
    </div>
  );
}
