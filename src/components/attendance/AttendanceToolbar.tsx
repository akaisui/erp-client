/**
 * AttendanceToolbar Component
 * Utilities: Export, Import, Lock Month
 */

import React from "react";
import { Download, Upload, Lock } from "lucide-react";
import type { Attendance, User } from "@/types";
import { handleExportAttendance } from "@/lib/excel";
import { useLockAttendanceMonth, useImportAttendance } from "@/hooks/api/useAttendance";

interface AttendanceToolbarProps {
  attendances: Attendance[];
  users: User[];
  month: string; // YYYY-MM format
  isLoading?: boolean;
}

export default function AttendanceToolbar({
  attendances,
  users,
  month,
  isLoading = false,
}: AttendanceToolbarProps) {
  const lockMonth = useLockAttendanceMonth();
  const importAttendance = useImportAttendance();
  
  // Convert YYYY-MM to YYYYMM
  const monthFormatted = month.replace("-", "");

  const handleExport = () => {
    handleExportAttendance(attendances, users, month);
  };

  const handleImportClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls,.csv";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        importAttendance.mutate(file);
      }
    };
    input.click();
  };

  const handleLockMonth = () => {
    if (
      confirm(
        "Bạn có chắc muốn chốt công tháng này? Hành động này không thể hoàn tác!"
      )
    ) {
      lockMonth.mutate(monthFormatted);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={attendances.length === 0 || isLoading || lockMonth.isPending || importAttendance.isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-green-700/80"
        title="Xuất bảng công ra Excel"
      >
        <Download className="h-4 w-4" />
        Xuất Excel
      </button>

      {/* Import Button */}
      <button
        onClick={handleImportClick}
        disabled={isLoading || lockMonth.isPending || importAttendance.isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
        title="Nhập dữ liệu từ máy chấm công (Excel/CSV)"
      >
        <Upload className="h-4 w-4" />
        {importAttendance.isPending ? "Đang nhập..." : "Nhập dữ liệu"}
      </button>

      {/* Lock Month Button */}
      <button
        onClick={handleLockMonth}
        disabled={isLoading || lockMonth.isPending || importAttendance.isPending}
        className="inline-flex items-center gap-2 rounded-lg border border-red-600 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-500 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
        title="Chốt công tháng (khóa dữ liệu, không thể sửa)"
      >
        <Lock className="h-4 w-4" />
        {lockMonth.isPending ? "Đang xử lý..." : "Chốt công tháng"}
      </button>

      {/* Info text */}
      <div className="text-xs text-gray-600 dark:text-gray-400 ml-auto">
        Tháng: <span className="font-medium">{month}</span>
      </div>
    </div>
  );
}
