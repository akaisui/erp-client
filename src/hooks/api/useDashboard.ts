import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type {
  DashboardMetrics,
  RevenueChartData,
  TopProduct,
  SalesChannelData,
  InventoryByType,
  RecentOrder,
  LowStockItem,
  OverdueDebt,
  DashboardData,
  ApiResponse,
} from "@/types";

// Query Keys
export const dashboardKeys = {
  all: ["dashboard"] as const,
  metrics: () => [...dashboardKeys.all, "metrics"] as const,
  revenue: (period: string) => [...dashboardKeys.all, "revenue", period] as const,
  topProducts: (limit: number) => [...dashboardKeys.all, "top-products", limit] as const,
  salesChannels: () => [...dashboardKeys.all, "sales-channels"] as const,
  inventoryByType: () => [...dashboardKeys.all, "inventory-by-type"] as const,
  recentOrders: (limit: number) => [...dashboardKeys.all, "recent-orders", limit] as const,
  lowStock: () => [...dashboardKeys.all, "low-stock"] as const,
  overdueDebts: () => [...dashboardKeys.all, "overdue-debts"] as const,
  fullData: () => [...dashboardKeys.all, "full-data"] as const,
};

// Get Dashboard Metrics
export function useDashboardMetrics() {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<DashboardMetrics>>(
        "/reports/dashboard/metrics"
      );
      return response.data;
    },
    refetchInterval: 60000, // Refetch every 1 minute
    staleTime: 30000, // Consider stale after 30 seconds
  });
}

// Get Revenue Chart Data
export function useRevenueChart(period: "day" | "week" | "month" | "year" = "month") {
  return useQuery({
    queryKey: dashboardKeys.revenue(period),
    queryFn: async () => {
      const response = await api.get<ApiResponse<RevenueChartData>>(
        "/reports/dashboard/revenue",
        { params: { period } }
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get Top Products
export function useTopProducts(limit = 10) {
  return useQuery({
    queryKey: dashboardKeys.topProducts(limit),
    queryFn: async () => {
      const response = await api.get<ApiResponse<TopProduct[]>>(
        "/reports/dashboard/top-products",
        { params: { limit } }
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get Sales Channel Distribution
export function useSalesChannels() {
  return useQuery({
    queryKey: dashboardKeys.salesChannels(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<SalesChannelData[]>>(
        "/reports/dashboard/sales-channels"
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get Inventory By Type
export function useInventoryByType() {
  return useQuery({
    queryKey: dashboardKeys.inventoryByType(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<InventoryByType[]>>(
        "/reports/dashboard/inventory-by-type"
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get Recent Orders
export function useRecentOrders(limit = 10) {
  return useQuery({
    queryKey: dashboardKeys.recentOrders(limit),
    queryFn: async () => {
      const response = await api.get<ApiResponse<RecentOrder[]>>(
        "/reports/dashboard/recent-orders",
        { params: { limit } }
      );
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for recent orders
    staleTime: 15000,
  });
}

// Get Low Stock Items
export function useLowStockItems() {
  return useQuery({
    queryKey: dashboardKeys.lowStock(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<LowStockItem[]>>(
        "/inventory/alerts"
      );
      return response.data;
    },
    refetchInterval: 60000, // Refetch every 1 minute
    staleTime: 30000,
  });
}

// Get Overdue Debts
export function useOverdueDebts() {
  return useQuery({
    queryKey: dashboardKeys.overdueDebts(),
    queryFn: async () => {
      const response = await api.get<ApiResponse<OverdueDebt[]>>(
        "/reports/dashboard/overdue-debts"
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get Activity Logs
export function useActivityLogs(limit = 10) {
  return useQuery({
    queryKey: ["activity-logs", limit],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>(
        "/activity-logs",
        { params: { limit } }
      );
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000,
  });
}

// Get Full Dashboard Stats (Optimized All-in-One)
export function useDashboardStats(
  period: 'day' | 'week' | 'month' = 'month',
  customDateRange?: { from: string; to: string } | null,
  warehouseId?: number | null
) {
  return useQuery({
    queryKey: customDateRange 
      ? [...dashboardKeys.fullData(), customDateRange.from, customDateRange.to, warehouseId]
      : [...dashboardKeys.fullData(), period, warehouseId],
    queryFn: async () => {
      const params: any = customDateRange
        ? { fromDate: customDateRange.from, toDate: customDateRange.to }
        : { period };
      
      if (warehouseId) {
        params.warehouseId = warehouseId;
      }
      
      const response = await api.get<ApiResponse<any>>(
        "/reports/dashboard/stats",
        { params }
      );
      return response;
    },
    refetchInterval: 60000, // Refetch every 1 minute
    staleTime: 30000, // Consider stale after 30 seconds
  });
}
