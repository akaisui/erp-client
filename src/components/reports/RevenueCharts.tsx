"use client";

import React from "react";
import dynamic from "next/dynamic";
import { formatPercentage } from "@/types/report.types";
import type { RevenueReport, SalesChannel } from "@/types/report.types";
import { ApexOptions } from "apexcharts";
import ReportCard from "./ReportCard";
import { formatCurrency } from "@/lib/utils";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface RevenueChartsProps {
  data: RevenueReport | null;
  isLoading?: boolean;
}

export default function RevenueCharts({ data, isLoading = false }: RevenueChartsProps) {
  if (isLoading || !data) return null;

  // Chart 1: Trend Line Chart (Revenue & Profit)
  const trendChartOptions: ApexOptions = {
    chart: {
      type: "area",
      height: 350,
      fontFamily: "Outfit, sans-serif",
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        },
      },
    },
    colors: ["#3B82F6"],
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
        opacityFrom: 0.4,
        opacityTo: 0.1,
      },
    },
    xaxis: {
      categories: data.trendData?.map((d: any) => d.date) || [],
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "12px",
        },
        formatter: (value) => formatCurrency(value),
      },
    },
    tooltip: {
      y: {
        formatter: (value) => formatCurrency(value),
      },
    },
    grid: {
      borderColor: "#E5E7EB",
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
    },
  };

  const trendChartSeries = [
    {
      name: "Doanh thu",
      data: data.trendData?.map((d: any) => d.revenue) || [],
    },
  ];

  // Chart 2: Channel Donut Chart
  const channelLabels: Record<SalesChannel, string> = {
    retail: "Bán lẻ",
    wholesale: "Bán sỉ",
    online: "Trực tuyến",
    distributor: "Đại lý",
  };

  const channelChartOptions: ApexOptions = {
    chart: {
      type: "donut",
      height: 300,
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
    labels:
      data.byChannel?.map((c: any) => {
        return channelLabels[c.channel as SalesChannel] || c.channel;
      }) || [],
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
    legend: {
      position: "bottom",
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
              label: "Tổng doanh thu",
              formatter: () => formatCurrency(data.summary.netRevenue),
            },
          },
        },
      },
    },
  };

  const channelChartSeries = data.byChannel?.map((c: any) => c.revenue) || [];

  // Chart 3: Top Products Bar Chart
  const topProductsChartOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 300,
      fontFamily: "Outfit, sans-serif",
      toolbar: {
        show: false,
      },
    },
    colors: ["#3B82F6"],
    plotOptions: {
      bar: {
        horizontal: true,
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => formatCurrency(val),
      offsetX: 0,
      style: {
        fontSize: "12px",
      },
    },
    xaxis: {
      categories: data.topProducts?.slice(0, 10).map((p: any) => p.productName) || [],
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "12px",
        },
        formatter: (value) => formatCurrency(parseFloat(value.toString())),
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "12px",
        },
      },
    },
    grid: {
      borderColor: "#E5E7EB",
    },
    tooltip: {
      y: {
        formatter: (value) => formatCurrency(value),
      },
    },
  };

  const topProductsChartSeries = [
    {
      name: "Doanh số",
      data: data.topProducts?.slice(0, 10).map((p: any) => p.revenue) || [],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Chart 1: Trend */}
      <ReportCard title="Xu hướng Doanh thu">
        <ReactApexChart
          options={trendChartOptions}
          series={trendChartSeries}
          type="area"
          height={350}
        />
      </ReportCard>

      {/* Chart 2 & 3 in Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Channel Distribution */}
        <ReportCard title="Doanh thu theo Kênh bán hàng">
          <ReactApexChart
            options={channelChartOptions}
            series={channelChartSeries}
            type="donut"
            height={300}
          />

          {/* Channel Table */}
          <div className="mt-6 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Kênh
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Doanh thu
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Đơn hàng
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {data.byChannel?.map((channel: any, idx: number) => {
                  return (
                    <tr key={idx}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {channelLabels[channel.channel as SalesChannel]}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        {formatCurrency(channel.revenue)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                        {channel.orderCount}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                        {formatPercentage(channel.percentage)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ReportCard>

        {/* Top Products */}
        <ReportCard title="Top 10 Sản phẩm bán chạy">
          <ReactApexChart
            options={topProductsChartOptions}
            series={topProductsChartSeries}
            type="bar"
            height={300}
          />
        </ReportCard>
      </div>
    </div>
  );
}
