"use client";

import React from "react";
import {
  ComposedChart,
  Line,
  Bar,
  BarChart,
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
import type { SalesReport } from "@/types/report.types";
import ReportCard from "./ReportCard";
import { formatCurrency } from "@/lib/utils";

interface SalesChartsProps {
  data: SalesReport;
  isLoading?: boolean;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function SalesCharts({ data, isLoading = false }: SalesChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700 lg:col-span-2" />
        <div className="h-80 animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-700" />
      </div>
    );
  }

  if (!data.trends?.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-center text-sm text-gray-500">Không có dữ liệu biểu đồ</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Chart 1: Revenue Trend - Total vs Paid (Diễn biến Doanh thu) */}
      <ReportCard title="Xu hướng Doanh thu & Thực thu">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data.trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: "12px" }} />
            <YAxis yAxisId="left" stroke="#6b7280" style={{ fontSize: "12px" }} />
            <YAxis yAxisId="right" orientation="right" stroke="#6b7280" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
              labelStyle={{ color: "#f3f4f6" }}
              formatter={(value: any) => {
                if (typeof value === "number") {
                  return formatCurrency(value);
                }
                return value;
              }}
            />
            <Legend />
            {/* Bar: Total Revenue */}
            <Bar yAxisId="left" dataKey="totalRevenue" fill="#3b82f6" name="Doanh thu tổng" radius={[4, 4, 0, 0]} />
            {/* Line: Paid Revenue */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="paidRevenue"
              stroke="#10b981"
              name="Thực thu"
              strokeWidth={3}
              dot={{ fill: "#10b981", r: 4 }}
            />
            {/* Area: Debt Amount */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="debtAmount"
              stroke="#f59e0b"
              name="Công nợ phát sinh"
              strokeWidth={2}
              dot={{ fill: "#f59e0b", r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ReportCard>

      {/* Charts Row: Sales by Channel + Top Products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart 2: Sales by Channel (Pie) */}
        <ReportCard title="Cơ cấu Doanh thu theo Kênh">
          {data.byChannel?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.byChannel as any}
                  dataKey="netRevenue"
                  nameKey="displayName"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  label={(entry: any) => `${entry.displayName}\n${entry.percentage.toFixed(0)}%`}
                >
                  {data.byChannel.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                  labelStyle={{ color: "#f3f4f6" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm text-gray-500">Không có dữ liệu</p>
          )}
        </ReportCard>

        {/* Chart 3: Top Products by Revenue (Bar) */}
        <ReportCard title="Top Sản phẩm Bán chạy" className="lg:col-span-2">
          {data.topProducts?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topProducts.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="productName"
                  stroke="#6b7280"
                  style={{ fontSize: "12px" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                  labelStyle={{ color: "#f3f4f6" }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-sm text-gray-500">Không có dữ liệu</p>
          )}
        </ReportCard>
      </div>
    </div>
  );
}
