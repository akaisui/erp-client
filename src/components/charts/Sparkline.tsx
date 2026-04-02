import React from "react";

export interface SparklineData {
  date: string;
  count: number;
}

interface SparklineProps {
  data: SparklineData[];
  height?: number;
  color?: "blue" | "green" | "red" | "amber" | "purple";
  showTooltip?: boolean;
}

/**
 * Sparkline Chart Component
 * Displays a mini line/bar chart showing trend
 */
export const Sparkline: React.FC<SparklineProps> = ({
  data,
  height = 48,
  color = "blue",
  showTooltip = true,
}) => {
  if (!data || data.length === 0) {
    return null;
  }

  const maxValue = Math.max(...data.map((d) => d.count), 1);
  const minValue = Math.min(...data.map((d) => d.count), 0);
  const range = maxValue - minValue || 1;

  const colorMap = {
    blue: "bg-blue-200 dark:bg-blue-800",
    green: "bg-green-200 dark:bg-green-800",
    red: "bg-red-200 dark:bg-red-800",
    amber: "bg-amber-200 dark:bg-amber-800",
    purple: "bg-purple-200 dark:bg-purple-800",
  };

  return (
    <div className="flex items-end gap-1" style={{ height: `${height}px` }}>
      {data.map((day, idx) => {
        const normalizedValue = (day.count - minValue) / range;
        const barHeight = Math.max(normalizedValue * 100, 5);

        return (
          <div
            key={idx}
            className={`flex-1 rounded-t ${colorMap[color]} transition-all duration-200 hover:opacity-75 cursor-pointer`}
            style={{ height: `${barHeight}%` }}
            title={showTooltip ? `${day.date}: ${day.count}` : undefined}
          />
        );
      })}
    </div>
  );
};

export default Sparkline;
