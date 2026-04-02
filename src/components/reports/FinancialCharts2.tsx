"use client";

import React from "react";
import {
  LineChart,
  Line,
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
import { formatCurrency } from "@/types/finance.types";
import type { FinancialReport } from "@/types/finance.types";

interface FinancialChartsProps {
  data: FinancialReport;
  isLoading?: boolean;
}

const COLORS = [
  "#10b981", // green - receipts
  "#ef4444", // red - payments
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ec4899", // pink
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded bg-gray-900 p-3 shadow-lg">
        <p className="text-xs font-semibold text-white">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-xs">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded bg-gray-900 p-3 shadow-lg">
        <p className="text-xs font-semibold text-white">{payload[0].name}</p>
        <p style={{ color: payload[0].fill }} className="text-xs font-semibold">
          {formatCurrency(payload[0].value)}
        </p>
        <p className="text-xs text-gray-300">
          {Number(payload[0].percent * 100).toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export default function FinancialCharts({
  data,
  isLoading = false,
}: FinancialChartsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="col-span-2 h-80 animate-pulse rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800" />
        <div className="h-80 animate-pulse rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800" />
      </div>
    );
  }

  const cashLedgerData = data?.cashLedger || [];
  const paymentsByType = data?.paymentsByType || [];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Line Chart - Cash Flow */}
      <div className="col-span-2 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
          Biểu đồ Dòng tiền (Thu/Chi theo ngày)
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={cashLedgerData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `${(value / 1000000).toFixed(0)}T`;
                }
                return `${(value / 1000).toFixed(0)}K`;
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="totalReceipts"
              stroke="#10b981"
              strokeWidth={2}
              name="Thu (₫)"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="totalPayments"
              stroke="#ef4444"
              strokeWidth={2}
              name="Chi (₫)"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart - Expense Breakdown */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
          Cơ cấu Chi phí
        </h4>
        {paymentsByType.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentsByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ displayName, percentage }) =>
                  `${displayName} (${(percentage * 100).toFixed(0)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {paymentsByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-80 items-center justify-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Không có dữ liệu chi phí
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
