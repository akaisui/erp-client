/**
 * DailyStatsCard Component
 * Shows today's attendance statistics
 */

import React, { useMemo } from "react";
import type { Attendance, User } from "@/types";
import { Users, UserCheck, UserX, Clock } from "lucide-react";

interface DailyStatsCardProps {
  attendances: Attendance[];
  users: User[];
  selectedDate?: string;
}

export default function DailyStatsCard({
  attendances,
  users,
  selectedDate,
}: DailyStatsCardProps) {
  const stats = useMemo(() => {
    const today = selectedDate || new Date().toISOString().split("T")[0];
    const todayAttendances = attendances.filter((att) => att.date === today);
    
    return {
      totalUsers: users.length,
      presentCount: todayAttendances.filter((att) => att.status === "present").length,
      absentCount: todayAttendances.filter((att) => att.status === "absent").length,
      lateCount: todayAttendances.filter((att) => att.status === "late").length,
      leaveCount: todayAttendances.filter((att) => att.status === "leave").length,
    };
  }, [attendances, users, selectedDate]);

  const formattedDate = selectedDate
    ? new Date(selectedDate).toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Thống kê hôm nay
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {formattedDate}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Users */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Tổng nhân sự
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              {stats.totalUsers}
            </p>
          </div>
        </div>

        {/* Present */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Hiện diện
            </p>
            <p className="mt-1 text-lg font-semibold text-green-600 dark:text-green-400">
              {stats.presentCount}
            </p>
          </div>
        </div>

        {/* Absent + Leave */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
            <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Vắng/Nghỉ
            </p>
            <p className="mt-1 text-lg font-semibold text-red-600 dark:text-red-400">
              {stats.absentCount + stats.leaveCount}
            </p>
          </div>
        </div>

        {/* Late */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Đi muộn
            </p>
            <p className="mt-1 text-lg font-semibold text-yellow-600 dark:text-yellow-400">
              {stats.lateCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
