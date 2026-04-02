"use client";

import React from "react";

interface ReportCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

export default function ReportCard({
  title,
  children,
  className = "",
  headerActions,
}: ReportCardProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
      </div>

      {/* Card Body */}
      <div className="p-6">{children}</div>
    </div>
  );
}
