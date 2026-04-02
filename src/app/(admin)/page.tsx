"use client";

import React, { useState } from "react";
import { useDashboardStats } from "@/hooks/api";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { LowStockAlertTable } from "@/components/dashboard/LowStockAlertTable";
import { TopProductsTable } from "@/components/dashboard/TopProductsTable";
import { SalesChannelChart } from "@/components/dashboard/SalesChannelChart";
import { InventoryByTypeChart } from "@/components/dashboard/InventoryByTypeChart";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { AlertsActionsSection } from "@/components/dashboard/AlertsActionsSection";
import { RecentActivitiesTimeline } from "@/components/dashboard/RecentActivitiesTimeline";
import { useAuth } from "@/hooks";
import {
  DollarSign,
  ShoppingCart,
  BookOpen,
  Factory,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month" | "custom">("month");
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [customDateRange, setCustomDateRange] = useState<{ from: string; to: string } | null>(null);

  const isAdmin = user?.role?.roleKey === "admin";

  // Map UI period to API period
  const apiPeriod: "day" | "week" | "month" = selectedPeriod === "today" ? "day" : selectedPeriod === "custom" ? "day" : selectedPeriod;
  
  // Determine footer text based on period
  const footerText = React.useMemo(() => {
    switch (selectedPeriod) {
      case "today": return "Số liệu hôm nay";
      case "week": return "Số liệu tuần này";
      case "month": return "Số liệu tháng này";
      case "custom": return "Giai đoạn tùy chỉnh";
      default: return "Số liệu trong kỳ";
    }
  }, [selectedPeriod]);

  // Fetch tất cả dữ liệu dashboard trong một lệnh gọi được tối ưu hóa duy nhất.
  const { data: statsResponse, isLoading } = useDashboardStats(apiPeriod, customDateRange, selectedWarehouse);
  const stats = statsResponse?.data as any;
  console.log('stats', stats);
  const kpi = stats?.kpi;
  const charts = stats?.charts;
  const alerts = stats?.alerts;
  const recent = stats?.recent;

  return (
    <div className="space-y-6">
      {/* Page Header with Filter - Flex Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: Header Text */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tổng quan
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Theo dõi tình hình kinh doanh và vận hành hệ thống
          </p>
        </div>

        {/* Right: Global Filter */}
        <div className="w-full sm:w-auto sm:min-w-max">
          <DashboardFilters
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            onDateRangeChange={(from, to) => setCustomDateRange({ from, to })}
            selectedWarehouse={selectedWarehouse}
            onWarehouseChange={setSelectedWarehouse}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {/* Metrics Grid - 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Doanh thu Thuần"
          value={kpi?.revenue?.current || 0}
          type="currency"
          trend={
            kpi?.revenue?.growth_percent
              ? {
                  value: kpi.revenue.growth_percent,
                  label: "so với kỳ trước",
                }
              : undefined
          }
          icon={<DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />}
          iconBg="bg-green-100 dark:bg-green-900/30"
          loading={isLoading}
          footerText={footerText}
        />

        <MetricCard
          title="Đơn hàng mới"
          value={kpi?.orders?.pending || 0}
          type="number"
          icon={<ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          suffix="đơn"
          loading={isLoading}
          footerText={footerText}
        />

        <MetricCard
          title="Công nợ Phải thu"
          value={kpi?.debt?.receivables || 0}
          type="currency"
          icon={<BookOpen className="h-6 w-6 text-orange-600 dark:text-orange-400" />}
          iconBg="bg-orange-100 dark:bg-orange-900/30"
          loading={isLoading}
          footerText={footerText}
        />

        <MetricCard
          title="Lệnh SX Đang chạy"
          value={kpi?.production?.active || 0}
          type="number"
          icon={<Factory className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          suffix="lệnh"
          loading={isLoading}
          footerText={footerText}
        />
      </div>

      {/* Revenue Chart - Full width */}
      {charts?.revenue_trend && (
        <div className="grid grid-cols-1">
          <RevenueChart initialData={charts.revenue_trend} period={apiPeriod} />
        </div>
      )}

      {/* Charts Row - 2 columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {charts?.sales_channels && <SalesChannelChart initialData={charts.sales_channels} />}
        {charts?.inventory_share && <InventoryByTypeChart initialData={charts.inventory_share} />}
      </div>

      {/* Alerts & Actions Section - 2 columns */}
      {alerts && <AlertsActionsSection initialLowStock={alerts.low_stock} initialOverdueDebts={alerts.overdue_debts} />}

      {/* Recent Orders - Full width */}
      {recent?.orders && (
        <div className="grid grid-cols-1">
          <RecentOrdersTable initialData={recent.orders} />
        </div>
      )}

      {/* Top Products - Full width */}
      {recent?.products && (
        <div className="grid grid-cols-1">
          <TopProductsTable initialData={recent.products} />
        </div>
      )}

      {/* Low Stock Alert - Full width */}
      <div className="grid grid-cols-1">
        <LowStockAlertTable initialData={alerts?.low_stock} />
      </div>

      {/* Recent Activities Timeline */}
      {recent?.activities && <RecentActivitiesTimeline initialData={recent.activities} />}
    </div>
  );
}
