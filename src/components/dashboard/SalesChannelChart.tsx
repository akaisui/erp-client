"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useSalesChannels } from "@/hooks/api";
import { formatCurrency } from "@/lib/utils";
import type { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const CHANNEL_COLORS = {
  online: "#3b82f6", // blue
  offline: "#10b981", // green
  wholesale: "#f59e0b", // amber
  retail: "#8b5cf6", // purple
  other: "#6b7280", // gray
};

interface SalesChannelChartProps {
  initialData?: any[];
}

export function SalesChannelChart({ initialData }: SalesChannelChartProps) {
  const { data: fetchedChannels, isLoading } = useSalesChannels();
  const rawChannels = initialData || fetchedChannels;
  const channels = Array.isArray(rawChannels) ? rawChannels : rawChannels?.data || [];

  // Prepare chart data
  const chartData: ApexOptions = React.useMemo(() => {
    if (!channels || channels.length === 0) {
      return {
        series: [],
        labels: [],
        chart: { type: "donut" },
      };
    }

    const colors = channels.map(
      (ch) => CHANNEL_COLORS[ch.channel as keyof typeof CHANNEL_COLORS] || CHANNEL_COLORS.other
    );

    return {
      series: channels.map((ch) => ch.revenue),
      labels: channels.map((ch) => {
        // Map channel names to Vietnamese
        const channelNames: Record<string, string> = {
          online: "Trực tuyến",
          offline: "Trực tiếp",
          wholesale: "Bán sỉ",
          retail: "Bán lẻ",
          other: "Khác",
        };
        return channelNames[ch.channel] || ch.channel;
      }),
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
                formatter: (val) => formatCurrency(Number(val)),
              },
              total: {
                show: true,
                label: "Tổng doanh thu",
                fontSize: "14px",
                fontWeight: 600,
                color: "#6b7280",
                formatter: (w) => {
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
        dropShadow: {
          enabled: false,
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
          formatter: (value, { seriesIndex }) => {
            const channel = channels[seriesIndex];
            return `
              <div style="padding: 4px 0;">
                <div><strong>${formatCurrency(value)}</strong></div>
                <div style="color: #6b7280; font-size: 12px; margin-top: 2px;">
                  ${channel.orderCount} đơn hàng
                </div>
              </div>
            `;
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
  }, [channels]);

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Phân bổ kênh bán hàng
        </h3>
        {channels && channels.length > 0 && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Tổng: {formatCurrency(channels.reduce((sum, ch) => sum + ch.revenue, 0))} •{" "}
            {channels.reduce((sum, ch) => sum + ch.orderCount, 0)} đơn hàng
          </p>
        )}
      </div>

      {/* Chart */}
      <div className="relative">
        {isLoading ? (
          <div className="flex h-[350px] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : channels && channels.length > 0 ? (
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
