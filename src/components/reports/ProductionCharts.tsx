"use client";

import React from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ProductionReport } from "@/types/report.types";
import ReportCard from "./ReportCard";
import { formatNumber } from "@/lib/utils";

interface ProductionChartsProps {
  data: ProductionReport;
  isLoading?: boolean;
}

const COLORS = ["#3b82f6", "#f59e0b", "#ef4444"];

export default function ProductionCharts({ data, isLoading = false }: ProductionChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700 lg:col-span-2" />
        <div className="h-80 animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700" />
      </div>
    );
  }

  if (!data || !data.planVsActualTrend?.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-center text-sm text-gray-500">Không có dữ liệu biểu đồ</p>
      </div>
    );
  }

  // Custom label formatter for cost structure pie
  const renderCostLabel = (entry: any) => {
    const labels: Record<string, string> = {
      raw_material: "Nguyên liệu",
      wastage: "Hao hụt",
      labor_overhead: "Lao động & Overhead",
    };
    return `${labels[entry.type]} ${entry.percentage.toFixed(1)}%`;
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Chart 1: Plan vs Actual (Grouped Bar) */}
      <ReportCard title="Kế hoạch vs Thực tế (Sản lượng)" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.planVsActualTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: "12px" }} />
            <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
              labelStyle={{ color: "#f3f4f6" }}
              formatter={(value: any) => formatNumber(value)}
            />
            <Legend />
            <Bar dataKey="planned" fill="#e5e7eb" name="Kế hoạch" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="actual"
              name="Thực tế"
              radius={[4, 4, 0, 0]}
            >
              {data.planVsActualTrend.map((entry: any, index) => {
                let color = "#ef4444"; // Red default
                if (entry.percentage >= 100) {
                  color = "#10b981"; // Green if achieved
                } else if (entry.percentage >= 80) {
                  color = "#f59e0b"; // Yellow if 80-100%
                }
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ReportCard>

      {/* Chart 2: Cost Structure (Donut/Pie) */}
      <ReportCard title="Cấu trúc Chi phí">
        {data.costStructure?.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.costStructure}
                dataKey="amount"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                label={renderCostLabel}
              >
                {data.costStructure.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatNumber(value)} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-sm text-gray-500">Không có dữ liệu</p>
        )}
      </ReportCard>

      {/* Chart 3: Top 5 Wastage by Material */}
      <ReportCard title="🚨 Top 5 Nguyên liệu hao hụt cao nhất" className="lg:col-span-3">
        {data.topWastageByMaterial?.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topWastageByMaterial}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="materialName" stroke="#6b7280" style={{ fontSize: "12px" }} angle={-45} textAnchor="end" height={80} />
              <YAxis yAxisId="left" stroke="#6b7280" style={{ fontSize: "12px" }} label={{ value: "Giá trị (VND)", angle: -90, position: "insideLeft" }} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" style={{ fontSize: "12px" }} label={{ value: "Tỷ lệ (%)", angle: 90 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                labelStyle={{ color: "#f3f4f6" }}
                formatter={(value: any, name: string) => {
                  if (name === "Giá trị hao hụt") return [formatNumber(value), name];
                  return [formatNumber(value) + "%", name];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="wastageCost" fill="#ef4444" name="Giá trị hao hụt (VND)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="wastagePercentage" fill="#f59e0b" name="Tỷ lệ (%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-sm text-gray-500">Không có dữ liệu hao hụt</p>
        )}
      </ReportCard>
    </div>
  );
}
