/**
 * Reports API Hooks (Updated for new sales report)
 */
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { ApiResponse } from "@/types/common.types";
import type {
  SalesReport,
  SalesReportFilters,
  RevenueReport,
  RevenueReportFilters,
  ProductionReport,
  ProductionReportFilters,
} from "@/types/report.types";

export const reportKeys = {
  all: ["reports"] as const,
  sales: (filters?: SalesReportFilters) => [...reportKeys.all, "sales", filters] as const,
  revenue: (filters?: RevenueReportFilters) => [...reportKeys.all, "revenue", filters] as const,
  production: (filters?: ProductionReportFilters) => [...reportKeys.all, "production", filters] as const,
};

export function useSalesReport(filters?: SalesReportFilters) {
  return useQuery({
    queryKey: reportKeys.sales(filters),
    queryFn: async () => {
      const response = await api.get<ApiResponse<SalesReport>>("/reports/sales", { 
        params: filters 
      });
      return response.data?.data || response.data;
    },
    enabled: !!filters,
  });
}

export function useRevenueReport(filters?: RevenueReportFilters) {
  return useQuery({
    queryKey: reportKeys.revenue(filters),
    queryFn: async () => {
      const response = await api.get<ApiResponse<RevenueReport>>("/reports/revenue", { 
        params: filters 
      });
      return response.data?.data || response.data;
    },
    enabled: !!filters,
  });
}

export function useProductionReport(filters?: ProductionReportFilters) {
  return useQuery({
    queryKey: reportKeys.production(filters),
    queryFn: async () => {
      const params = {
        startDate: filters?.fromDate,
        endDate: filters?.toDate,
        status: filters?.status,
        finishedProductId: filters?.finishedProductId,
        createdBy: filters?.createdBy,
      };

      const [summary, timeline, topWastage, costStructure, orders, materials] = await Promise.all([
        api.get<ApiResponse<any>>("/reports/production/summary", { params }),
        api.get<ApiResponse<any>>("/reports/production/charts/timeline", { params }),
        api.get<ApiResponse<any>>("/reports/production/charts/top-wastage", { params }),
        api.get<ApiResponse<any>>("/reports/production/charts/cost-structure", { params }),
        api.get<ApiResponse<any>>("/reports/production/orders", { params }),
        api.get<ApiResponse<any>>("/reports/production/material-usage", { params }),
      ]);

      return {
        summary: summary.data?.summary || {},
        planVsActualTrend: timeline.data?.planVsActualTrend || [],
        topWastageByMaterial: topWastage.data?.topWastageByMaterial || [],
        costStructure: costStructure.data?.costStructure || [],
        orders: orders.data?.orders || [],
        output: (orders.data?.orders || [])?.map((o: any) => ({
          productId: o.id,
          productName: o.productName,
          plannedQuantity: o.plannedQuantity,
          producedQuantity: o.actualQuantity,
          completionRate: o.completionPercentage,
          wastage: 0,
        })) || [],
        materialConsumption: materials.data?.materialConsumption || [],
      };
    },
    enabled: !!filters,
  });
}

// Financial Report Hook
export function useFinancialReport(filters?: any) {
  return useQuery({
    queryKey: ["reports", "financial", filters],
    queryFn: async () => {
      const params = {
        fromDate: filters?.fromDate,
        toDate: filters?.toDate,
        datePreset: filters?.datePreset,
      };

      const response = await api.get<ApiResponse<any>>("/reports/financial", { params });
      return response.data?.data || response.data;
    },
    enabled: !!filters,
  });
}

