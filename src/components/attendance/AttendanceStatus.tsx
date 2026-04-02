import React from "react";
import Badge from "@/components/ui/badge/Badge";
import type { AttendanceStatus, LeaveType } from "@/types";
import { CheckCircle, XCircle, Clock, Home, UserX } from "lucide-react";

const STATUS_COLORS: Record<AttendanceStatus, "green" | "red" | "yellow" | "blue" | "gray" | "purple"> = {
  present: "green",
  absent: "red",
  late: "yellow",
  leave: "blue",
  work_from_home: "purple",
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Có mặt",
  absent: "Vắng mặt",
  late: "Đi muộn",
  leave: "Nghỉ phép",
  work_from_home: "WFH",
};

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  none: "Không phải nghỉ",
  annual: "Nghỉ phép năm",
  sick: "Nghỉ ốm",
  unpaid: "Nghỉ không lương",
  other: "Khác",
};

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
  showIcon?: boolean;
}

export default function AttendanceStatusBadge({
  status,
  showIcon = false,
}: AttendanceStatusBadgeProps) {
  const StatusIcon = {
    present: CheckCircle,
    absent: XCircle,
    late: Clock,
    leave: UserX,
    work_from_home: Home,
  }[status];

  return (
    <Badge color={STATUS_COLORS[status]}>
      {showIcon && <StatusIcon className="mr-1 h-3 w-3" />}
      {STATUS_LABELS[status]}
    </Badge>
  );
}

interface LeaveTypeDisplayProps {
  leaveType: LeaveType;
}

export function LeaveTypeDisplay({ leaveType }: LeaveTypeDisplayProps) {
  if (leaveType === "none") {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  const colors: Record<Exclude<LeaveType, "none">, string> = {
    annual: "text-blue-600 dark:text-blue-400",
    sick: "text-red-600 dark:text-red-400",
    unpaid: "text-gray-600 dark:text-gray-400",
    other: "text-purple-600 dark:text-purple-400",
  };

  return (
    <span className={`text-sm font-medium ${colors[leaveType as Exclude<LeaveType, "none">]}`}>
      {LEAVE_TYPE_LABELS[leaveType]}
    </span>
  );
}

interface TimeDisplayProps {
  time?: string;
  label?: string;
}

export function TimeDisplay({ time, label }: TimeDisplayProps) {
  if (!time) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  // Time format: HH:MM:SS -> HH:MM
  const formattedTime = time.substring(0, 5);

  return (
    <div className="flex items-center gap-1">
      {label && <span className="text-xs text-gray-500 dark:text-gray-400">{label}:</span>}
      <span className="font-medium text-gray-900 dark:text-white">{formattedTime}</span>
    </div>
  );
}

interface WorkHoursDisplayProps {
  hours?: number;
  standard?: number; // Standard work hours (default: 8)
}

export function WorkHoursDisplay({ hours, standard = 8 }: WorkHoursDisplayProps) {
  if (hours === undefined || hours === null) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  const percentage = (hours / standard) * 100;
  const isUndertime = hours < standard;
  const isOvertime = hours > standard;

  let colorClass = "text-gray-900 dark:text-white";
  if (isUndertime) colorClass = "text-yellow-600 dark:text-yellow-400";
  if (isOvertime) colorClass = "text-green-600 dark:text-green-400";

  return (
    <div className="flex items-center gap-2">
      <span className={`font-medium ${colorClass}`}>{hours.toFixed(1)}h</span>
      {hours !== standard && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({isOvertime ? "+" : ""}
          {(hours - standard).toFixed(1)}h)
        </span>
      )}
    </div>
  );
}

interface OvertimeBadgeProps {
  hours?: number;
}

export function OvertimeBadge({ hours }: OvertimeBadgeProps) {
  if (!hours || hours === 0) {
    return null;
  }

  return (
    <Badge color="green">
      +{hours.toFixed(1)}h OT
    </Badge>
  );
}

interface CheckStatusIndicatorProps {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
}

export function CheckStatusIndicator({
  hasCheckedIn,
  hasCheckedOut,
}: CheckStatusIndicatorProps) {
  if (!hasCheckedIn) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="h-2 w-2 rounded-full bg-gray-400" />
        Chưa chấm công
      </div>
    );
  }

  if (hasCheckedIn && !hasCheckedOut) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
        Đang làm việc
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
      <div className="h-2 w-2 rounded-full bg-blue-500" />
      Đã hoàn thành
    </div>
  );
}

interface AttendanceSummaryProps {
  checkInTime?: string;
  checkOutTime?: string;
  workHours?: number;
  status: AttendanceStatus;
}

export function AttendanceSummary({
  checkInTime,
  checkOutTime,
  workHours,
  status,
}: AttendanceSummaryProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 dark:text-white">Chấm công hôm nay</h4>
        <AttendanceStatusBadge status={status} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Giờ vào:</span>
          <TimeDisplay time={checkInTime} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Giờ ra:</span>
          <TimeDisplay time={checkOutTime} />
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-900 dark:text-white">Giờ công:</span>
          <WorkHoursDisplay hours={workHours} />
        </div>
      </div>
    </div>
  );
}

interface LocationDisplayProps {
  location?: string;
  type: "check-in" | "check-out";
}

export function LocationDisplay({ location, type }: LocationDisplayProps) {
  if (!location) {
    return <span className="text-gray-400 dark:text-gray-500">—</span>;
  }

  const label = type === "check-in" ? "Vị trí vào" : "Vị trí ra";

  return (
    <div className="text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}: </span>
      <span className="text-gray-900 dark:text-white">{location}</span>
    </div>
  );
}
