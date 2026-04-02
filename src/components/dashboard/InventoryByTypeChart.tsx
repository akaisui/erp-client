"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useInventoryByType } from "@/hooks/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const TYPE_COLORS = {
  raw_material: "#3b82f6",
  semi_finished: "#f59e0b",
  finished: "#10b981",
  accessory: "#8b5cf6",
  packaging: "#ec4899",
  other: "#6b7280",
};

interface InventoryByTypeChartProps {
  initialData?: any[];
}

export function InventoryByTypeChart({ initialData }: InventoryByTypeChartProps) {
  const { data: inventoryTypes, isLoading } = useInventoryByType();

  // Use initial data if provided, otherwise use API
  const rawInventoryTypes = initialData || inventoryTypes;
  const chartInventoryTypes = Array.isArray(rawInventoryTypes) ? rawInventoryTypes : rawInventoryTypes?.data || [];

  // Prepare chart data as Pie/Donut
  const chartData: ApexOptions = React.useMemo(() => {
    if (!chartInventoryTypes || chartInventoryTypes.length === 0) {
      return {
        series: [],
        labels: [],
        chart: { type: "donut", height: 350 },
      };
    }

    const typeNames: Record<string, string> = {
      raw_material: "Nguyên liệu",
      semi_finished: "Bán thành phẩm",
      finished: "Thành phẩm",
      accessory: "Phụ kiện",
      packaging: "Bao bì",
      other: "Khác",
    };

    const colors = chartInventoryTypes.map(
      (item: any) =>
        TYPE_COLORS[item.productType as keyof typeof TYPE_COLORS] || TYPE_COLORS.other
    );

    return {
      series: chartInventoryTypes.map((item: any) => item.value),
      labels: chartInventoryTypes.map(
        (item: any) => typeNames[item.productType] || item.productType
      ),
      chart: {
        type: "donut",
        height: 350,
        toolbar: {
          show: false,
        },
      },
      colors,
      plotOptions: {
        pie: {
          donut: {
            size: "65%",
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: "16px",
                fontWeight: 600,
                color: undefined,
                offsetY: -10,
              },
              value: {
                show: true,
                fontSize: "24px",
                fontWeight: 700,
                color: undefined,
                offsetY: 5,
                formatter: (val: string) => {
                  const num = parseFloat(val);
                  return formatCurrency(num);
                },
              },
              total: {
                show: true,
                label: "Tổng giá trị",
                fontSize: "14px",
                fontWeight: 600,
                color: "#6b7280",
                formatter: (w: any) => {
                  const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                  return formatCurrency(total);
                },
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`,
        style: {
          fontSize: "12px",
          fontWeight: 600,
        },
      },
      legend: {
        position: "bottom",
        horizontalAlign: "center",
        fontSize: "14px",
        fontWeight: 500,
        labels: {
          colors: "#6b7280",
        },
        markers: {
          width: 12,
          height: 12,
          radius: 3,
        } as any,
        itemMargin: {
          horizontal: 12,
          vertical: 8,
        },
      },
      tooltip: {
        y: {
          formatter: (value) => {
            return formatCurrency(value);
          },
        },
        theme: "light",
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 300,
            },
            legend: {
              position: "bottom",
            },
          },
        },
      ],
    };
  }, [chartInventoryTypes]);

  // Calculate total stats
  const totalStats = React.useMemo(() => {
    if (!chartInventoryTypes || chartInventoryTypes.length === 0) {
      return { totalQuantity: 0, totalValue: 0 };
    }
    return {
      totalQuantity: chartInventoryTypes.reduce((sum: number, item: any) => sum + item.quantity, 0),
      totalValue: chartInventoryTypes.reduce((sum: number, item: any) => sum + item.value, 0),
    };
  }, [chartInventoryTypes]);

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tỷ trọng Tồn kho theo loại
        </h3>
        {chartInventoryTypes && chartInventoryTypes.length > 0 && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Tổng: {formatNumber(totalStats.totalQuantity)} sản phẩm •{" "}
            {formatCurrency(totalStats.totalValue)}
          </p>
        )}
      </div>

      {/* Chart */}
      <div className="relative">
        {isLoading ? (
          <div className="flex h-[350px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : chartInventoryTypes && chartInventoryTypes.length > 0 ? (
          <ReactApexChart
            options={chartData}
            series={chartData.series}
            type="donut"
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
