"use client";

import Footer from "@/components/footer/Footer";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { useEffect } from "react";
import { useAuthStore } from "@/stores";
import { useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { isAuthenticated } = useAuthStore();

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return <div>Đang chuyển hướng đến trang đăng nhập...</div>;
  }

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex overflow-x-hidden">
      <AppSidebar />
      <Backdrop />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out min-w-0 ${mainContentMargin}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-full md:p-6">
          {children}
          <Footer />
        </div>
      </div>
    </div>
  );
}