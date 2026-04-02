"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface InventoryChartsV2Props {
  byType: Array<{
    productType: string;
    quantity: number;
    value: number;
    itemCount: number;
  }>;
  topProducts: Array<{
    productName: string;
    sku: string;
    quantity: number;
    value: number;
    percentage: number;
  }>;
  flowByDay?: Array<{
    date: string;
    import: number;
    export: number;
  }>;
  isLoading?: boolean;
}

const typeLabels: Record<string, string> = {
  raw_material: "Nguyên liệu",
  packaging: "Bao bì",
  finished_product: "Thành phẩm",
  goods: "Hàng hóa",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function InventoryChartsV2({
  byType,
  topProducts,
  flowByDay,
  isLoading = false,
}: InventoryChartsV2Props) {
  if (isLoading || !byType || !topProducts) return null;

  // Chart 1: Inventory by Type (Donut)
  const typeLabelsArray = byType.map((item) => typeLabels[item.productType] || item.productType);
  const typeValuesArray = byType.map((item) => item.value);
  const typeTotalValue = typeValuesArray.reduce((a, b) => a + b, 0);

  const typeOptions: ApexOptions = {
    chart: {
      type: "donut",
      height: 350,
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: true },
    },
    colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
    labels: typeLabelsArray,
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: {
        fontSize: "12px",
        fontWeight: 600,
      },
    },
    legend: {
      position: "bottom" as const,
      fontSize: "12px",
    },
    tooltip: {
      y: {
        formatter: (value) => formatCurrency(value),
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Tổng Giá Trị",
              fontSize: "12px",
              fontWeight: 600,
              formatter: () => formatCurrency(typeTotalValue),
            },
          },
        },
      },
    },
  };

  // Chart 2: Top Products (Horizontal Bar)
  const topProductsLabels = topProducts.slice(0, 10).map((p) => `${p.sku} - ${p.productName}`);
  const topProductsValues = topProducts.slice(0, 10).map((p) => p.quantity);

  const topProductsOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 350,
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: true },
    },
    colors: ["#3B82F6"],
    plotOptions: {
      bar: {
        horizontal: true,
        distributed: false,
        dataLabels: {
          position: "top" as const,
        },
      },
    },
    xaxis: {
      categories: topProductsLabels,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    tooltip: {
      y: {
        formatter: (value) => `${value.toFixed(0)} đơn vị`,
      },
    },
    dataLabels: {
      enabled: true,
      offsetX: 5,
      formatter: (val: number) => `${val.toFixed(0)}`,
    },
  };

  // Chart 3: Import/Export Flow (Stacked Bar) - Optional
  const flowOptions: ApexOptions = flowByDay && flowByDay.length > 0 ? {
    chart: {
      type: "bar",
      height: 300,
      fontFamily: "Outfit, sans-serif",
      stacked: true,
      toolbar: { show: true },
    },
    colors: ["#10B981", "#EF4444"],
    xaxis: {
      categories: flowByDay.map((item) => {
        const date = new Date(item.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }),
      axisBorder: { show: true },
    },
    legend: {
      position: "top" as const,
      fontSize: "12px",
    },
    tooltip: {
      y: {
        formatter: (value) => `${value.toFixed(0)} đơn vị`,
      },
    },
    dataLabels: {
      enabled: false,
    },
  } : {};

  return (
    <div className="space-y-6">
      {/* Row 1: Donut & Bar Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: By Type */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Giá Trị Tồn Kho Theo Loại
          </h3>
          <ReactApexChart
            options={typeOptions}
            series={typeValuesArray}
            type="donut"
            height={350}
          />
        </div>

        {/* Chart 2: Top Products */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Top 10 Sản Phẩm Tồn Kho Cao
          </h3>
          <ReactApexChart
            options={topProductsOptions}
            series={[{ data: topProductsValues }]}
            type="bar"
            height={350}
          />
        </div>
      </div>

      {/* Row 2: Flow Chart (if data available) */}
      {flowByDay && flowByDay.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Biến Động Nhập - Xuất Theo Ngày
          </h3>
          <ReactApexChart
            options={flowOptions}
            series={[
              { name: "Nhập", data: flowByDay.map((item) => item.import) },
              { name: "Xuất", data: flowByDay.map((item) => item.export) },
            ]}
            type="bar"
            height={300}
          />
        </div>
      )}
    </div>
  );
}
