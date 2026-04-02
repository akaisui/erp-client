"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useRevenueChart } from "@/hooks/api";
import { formatCurrency } from "@/lib/utils";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type PeriodType = "day" | "week" | "month" | "year";

interface RevenueChartProps {
  initialData?: any[];
  period?: PeriodType;
}

export function RevenueChart({ initialData, period = "month" }: RevenueChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>(period);

  // Sync state with prop if it changes
  React.useEffect(() => {
    setSelectedPeriod(period);
  }, [period]);

  const { data, isLoading } = useRevenueChart(selectedPeriod);

  // Use initial data only if the selected period matches the prop period
  const rawChartData = (selectedPeriod === period && initialData) ? initialData : data?.data;
  const chartData = Array.isArray(rawChartData) ? rawChartData : rawChartData?.data || [];

  // Prepare chart data with Revenue and Expenses
  const apexChartData: ApexOptions = React.useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        series: [],
        chart: { type: "area", height: 350 },
      };
    }

    return {
      series: [
        {
          name: "Doanh thu",
          data: chartData.map((item: any) => item.revenue),
        },
        {
          name: "Chi phí",
          data: chartData.map((item: any) => item.expenses || 0),
        },
      ],
      chart: {
        type: "area",
        height: 350,
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "smooth",
        width: 2,
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 90, 100],
        },
      },
      colors: ["#10b981", "#ef4444"],
      xaxis: {
        categories: chartData.map((item: any) => {
          const date = new Date(item.date);
          if (selectedPeriod === "day") {
            return date.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            });
          }
          return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
          });
        }),
        labels: {
          style: {
            colors: "#6b7280",
          },
        },
      },
      yaxis: {
        labels: {
          formatter: (value) => {
            if (value >= 1000000000) {
              return `${(value / 1000000000).toFixed(1)}B`;
            }
            if (value >= 1000000) {
              return `${(value / 1000000).toFixed(1)}M`;
            }
            if (value >= 1000) {
              return `${(value / 1000).toFixed(0)}K`;
            }
            return value.toFixed(0);
          },
          style: {
            colors: "#6b7280",
          },
        },
      },
      grid: {
        borderColor: "#e5e7eb",
        strokeDashArray: 5,
      },
      tooltip: {
        y: {
          formatter: (value) => formatCurrency(value),
        },
        theme: "light",
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
      },
    };
  }, [chartData, selectedPeriod]);

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Biểu đồ Doanh thu & Chi phí
          </h3>
          {data && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Tổng doanh thu: {formatCurrency((data as any).total_revenue)} • {(data as any).total_orders} đơn hàng
            </p>
          )}
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {(["day", "week", "month", "year"] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedPeriod === p
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {p === "day" && "Ngày"}
              {p === "week" && "Tuần"}
              {p === "month" && "Tháng"}
              {p === "year" && "Năm"}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {isLoading ? (
          <div className="flex h-[350px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : chartData && chartData.length > 0 ? (
          <ReactApexChart
            options={apexChartData}
            series={apexChartData.series}
            type="area"
            height={350}
          />
        ) : (
          <div className="flex h-[350px] items-center justify-center text-gray-500 dark:text-gray-400">
            Không có dữ liệu
          </div>
        )}
      </div>
    </div>
  );
}
