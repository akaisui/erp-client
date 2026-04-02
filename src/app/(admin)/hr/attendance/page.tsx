"use client";

import React, { useState, useMemo } from "react";
import { useMyAttendance, useAttendance, useAttendanceStatistics } from "@/hooks/api/useAttendance";
import { useUsers } from "@/hooks/api/useUsers";
import { Can } from "@/components/auth";
import AttendanceCalendar from "@/components/attendance/AttendanceCalendar";
import AttendanceMonthlyMatrix from "@/components/attendance/AttendanceMonthlyMatrix";
import DailyStatsCard from "@/components/attendance/DailyStatsCard";
import AttendanceApprovalsTab from "@/components/attendance/AttendanceApprovalsTab";
import AttendanceToolbar from "@/components/attendance/AttendanceToolbar";
import GenerateQRDialog from "@/components/attendance/GenerateQRDialog";
import RequestLeaveDialog from "@/components/attendance/RequestLeaveDialog";
import AttendanceStatusBadge, {
  TimeDisplay,
  WorkHoursDisplay,
  LeaveTypeDisplay,
} from "@/components/attendance/AttendanceStatus";
import { ClassicCard } from "@/components/ui/card/StatCards";
import type { Attendance, AttendanceStatistics, User } from "@/types";
import {
  Calendar,
  List,
  Clock,
  TrendingUp,
  UserCheck,
  UserX,
  Grid3x3,
  CheckCircle2,
  QrCode,
} from "lucide-react";

export default function AttendancePage() {
  const [viewMode, setViewMode] = useState<"calendar" | "list" | "matrix">("matrix");
  const [activeTab, setActiveTab] = useState<"overview" | "approvals">("overview");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedUserId, setSelectedUserId] = useState<number | "me">("me");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showRequestLeave, setShowRequestLeave] = useState(false);

  // Fetch data
  const isMyView = selectedUserId === "me";
  const monthFormatted = selectedMonth.replace("-", ""); // YYYY-MM -> YYYYMM
  const { data: myAttendanceData } = useMyAttendance({
    month: monthFormatted,
  });
  const { data: allAttendanceData } = useAttendance({
    userId: selectedUserId !== "me" ? selectedUserId : undefined,
    month: monthFormatted,
  });
  const { data: statisticsData } = useAttendanceStatistics({ month: monthFormatted });
  const { data: usersData } = useUsers({ status: "active" });

  const attendancesWrapper = isMyView
    ? myAttendanceData?.data || []
    : allAttendanceData?.data || [];
  const attendances = attendancesWrapper as unknown as Attendance[];
  const statistics = statisticsData?.data as unknown as AttendanceStatistics;
  const users = usersData?.data as unknown as User[] || [];

  // Filter attendances by selected date if in list view
  const filteredAttendances = useMemo(() => {
    if (!selectedDate || viewMode !== "list") return attendances;
    return attendances.filter((att) => att.date === selectedDate);
  }, [attendances, selectedDate, viewMode]);

  const handleDateClick = (date: string, attendance?: Attendance) => {
    setSelectedDate(date);
    setViewMode("list");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Chấm công
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý và theo dõi chấm công nhân viên
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* QR Code Button */}
          <Can permission="update_attendance">
            <button
              onClick={() => setShowQRDialog(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <QrCode className="h-4 w-4" />
              Tạo QR
            </button>
          </Can>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-1 dark:border-gray-700">
          <button
            onClick={() => setViewMode("matrix")}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              viewMode === "matrix"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <Grid3x3 className="h-4 w-4" />
            Bảng công
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              viewMode === "calendar"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Lịch
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            <List className="h-4 w-4" />
            Danh sách
          </button>
        </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ClassicCard
            title="Ngày Có Mặt"
            value={statistics?.presentDays || 0}
            icon={UserCheck}
            color="green"
            description="Nhân viên đã chấm công"
          />
          
          <ClassicCard
            title="Ngày Vắng"
            value={statistics?.absentDays || 0}
            icon={UserX}
            color="red"
            description="Nhân viên vắng mặt"
          />
          
          <ClassicCard
            title="Tổng Giờ Công"
            value={`${(statistics?.totalWorkHours || 0).toFixed(1)}h`}
            icon={Clock}
            color="blue"
            description="Tính trong kỳ"
          />
          
          <ClassicCard
            title="TB Giờ/Ngày"
            value={`${(statistics?.averageWorkHours || 0).toFixed(1)}h`}
            icon={TrendingUp}
            color="purple"
            description="Bình quân mỗi ngày"
          />
        </div>
      )}

      {/* Daily Stats Card */}
      <DailyStatsCard 
        attendances={attendances} 
        users={users} 
        selectedDate={selectedDate || undefined} 
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tổng quan
            </div>
          </button>
          <Can permission="approve_leave">
            <button
              onClick={() => setActiveTab("approvals")}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "approvals"
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Cần duyệt
              </div>
            </button>
          </Can>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            {/* Month Selector */}
            <div className="flex-1">
              <label htmlFor="month" className="sr-only">
                Tháng
              </label>
              <input
                type="month"
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* User Selector (Admin only) */}
            <Can permission="view_attendance">
              <div className="flex-1">
                <label htmlFor="user" className="sr-only">
                  Nhân viên
                </label>
                <select
                  id="user"
                  value={selectedUserId}
                  onChange={(e) =>
                    setSelectedUserId(e.target.value === "me" ? "me" : Number(e.target.value))
                  }
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="me">Của tôi</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} ({user.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
            </Can>
          </div>

          {/* Toolbar */}
          <Can permission="view_attendance">
            <AttendanceToolbar 
              attendances={attendances}
              users={users}
              month={selectedMonth}
            />
          </Can>

          {/* Matrix View */}
          {viewMode === "matrix" && (
            <AttendanceMonthlyMatrix
              attendances={attendances}
              users={isMyView ? [{ id: 0, fullName: "Của tôi" } as User] : users}
              month={selectedMonth}
              onCellClick={(userId, date) => {
                setSelectedDate(date);
                setViewMode("list");
              }}
            />
          )}

          {/* Calendar View */}
          {viewMode === "calendar" && (
            <AttendanceCalendar
              attendances={attendances}
              month={selectedMonth}
              onMonthChange={setSelectedMonth}
              onDateClick={handleDateClick}
            />
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              {selectedDate && (
                <div className="border-b border-gray-200 p-4 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Hiển thị dữ liệu cho ngày:{" "}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(selectedDate).toLocaleDateString("vi-VN")}
                    </span>
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Xem tất cả
                    </button>
                  </p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Ngày
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Giờ vào
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Giờ ra
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Giờ công
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Loại nghỉ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Ghi chú
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {filteredAttendances.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                          Không có dữ liệu chấm công
                        </td>
                      </tr>
                    ) : (
                      filteredAttendances.map((attendance) => (
                        <tr key={attendance.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {new Date(attendance.date).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            <TimeDisplay time={attendance.checkInTime} />
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            <TimeDisplay time={attendance.checkOutTime} />
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            <WorkHoursDisplay hours={attendance.workHours} />
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            <AttendanceStatusBadge status={attendance.status} />
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            <LeaveTypeDisplay leaveType={attendance.leaveType} />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {attendance.notes || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approvals Tab */}
      {activeTab === "approvals" && (
        <AttendanceApprovalsTab attendances={attendances} users={users} />
      )}

      {/* QR Code Dialog */}
      <GenerateQRDialog
        isOpen={showQRDialog}
        onClose={() => setShowQRDialog(false)}
      />
      
      <RequestLeaveDialog
        isOpen={showRequestLeave}
        onClose={() => setShowRequestLeave(false)}
      />
    </div>
  );
}