"use client";

import React from "react";
import Link from "next/link";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Factory,
  DollarSign,
  ArrowRight
} from "lucide-react";

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

function ReportCardLink({ title, description, icon, href, color }: ReportCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${color} mb-4`}>
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {title}
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
      </div>
    </Link>
  );
}

export default function ReportsPage() {
  const reports = [
    {
      title: "Báo cáo doanh thu",
      description: "Theo dõi doanh thu theo thời gian, kênh bán hàng và khu vực với biểu đồ chi tiết",
      icon: <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      href: "/reports/revenue",
      color: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Báo cáo tồn kho",
      description: "Quản lý tồn kho theo kho, danh mục và phân tích tỷ lệ quay vòng hàng tồn kho",
      icon: <Package className="h-6 w-6 text-green-600 dark:text-green-400" />,
      href: "/reports/inventory",
      color: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Báo cáo bán hàng",
      description: "Xem sản phẩm bán chạy, khách hàng tiềm năng và hiệu suất nhân viên bán hàng",
      icon: <ShoppingCart className="h-6 w-6 text-purple-600 dark:text-purple-400" />,
      href: "/reports/sales",
      color: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "Báo cáo sản xuất",
      description: "Theo dõi sản lượng, tiêu hao nguyên liệu và phân tích tỷ lệ hao hụt trong sản xuất",
      icon: <Factory className="h-6 w-6 text-orange-600 dark:text-orange-400" />,
      href: "/reports/production",
      color: "bg-orange-100 dark:bg-orange-900/30",
    },
    {
      title: "Báo cáo tài chính",
      description: "Xem báo cáo lãi lỗ (P&L), dòng tiền và phân tích công nợ theo độ tuổi",
      icon: <DollarSign className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />,
      href: "/reports/financial",
      color: "bg-yellow-100 dark:bg-yellow-900/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <PageBreadCrumb
        pages={[
          { name: "Báo cáo", href: "#" },
        ]}
      />

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Báo cáo & Phân tích
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Xem các báo cáo chi tiết về doanh thu, tồn kho, bán hàng, sản xuất và tài chính
        </p>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <ReportCardLink key={report.href} {...report} />
        ))}
      </div>

      {/* Quick Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <svg
              className="h-5 w-5 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Thông tin hữu ích
            </h4>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
              Tất cả các báo cáo có thể xuất ra định dạng Excel hoặc PDF.
              Sử dụng bộ lọc để tùy chỉnh khoảng thời gian và các tiêu chí khác phù hợp với nhu cầu phân tích của bạn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
