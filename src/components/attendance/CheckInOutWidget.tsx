"use client";

import React, { useState, useEffect } from "react";
import { useTodayAttendance, useCheckIn, useCheckOut } from "@/hooks/api/useAttendance";
import { Clock, LogIn, LogOut, MapPin } from "lucide-react";

export default function CheckInOutWidget() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [location, setLocation] = useState<string | undefined>();

  const { data: todayData } = useTodayAttendance();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const todayStatus = todayData?.data;

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get user location (optional)
  const getUserLocation = (): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(undefined);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          resolve(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        },
        () => {
          resolve(undefined);
        },
        { timeout: 5000 }
      );
    });
  };

  const handleCheckIn = async () => {
    try {
      const loc = await getUserLocation();
      await checkIn.mutateAsync({ location: loc });
    } catch (error) {
      console.error("Check in failed:", error);
    }
  };

  const handleCheckOut = async () => {
    try {
      const loc = await getUserLocation();
      await checkOut.mutateAsync({ location: loc });
    } catch (error) {
      console.error("Check out failed:", error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const canCheckIn = !todayStatus?.hasCheckedIn;
  const canCheckOut = todayStatus?.hasCheckedIn && !todayStatus?.hasCheckedOut;

  return (
    <div className="flex items-center gap-2">
      {/* Current Time Display */}
      <div className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900 lg:flex">
        <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {currentTime.toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* Check In Button */}
      {canCheckIn && (
        <button
          onClick={handleCheckIn}
          disabled={checkIn.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-900"
          title="Chấm công vào"
        >
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">
            {checkIn.isPending ? "Đang xử lý..." : "Chấm công vào"}
          </span>
        </button>
      )}

      {/* Check Out Button */}
      {canCheckOut && (
        <button
          onClick={handleCheckOut}
          disabled={checkOut.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-gray-900"
          title="Chấm công ra"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">
            {checkOut.isPending ? "Đang xử lý..." : "Chấm công ra"}
          </span>
        </button>
      )}

      {/* Status Indicator (when both checked in and out) */}
      {todayStatus?.hasCheckedIn && todayStatus?.hasCheckedOut && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-900/20">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            Đã hoàn thành
          </span>
        </div>
      )}

      {/* Work Hours Display (when checked in) */}
      {todayStatus?.hasCheckedIn && todayStatus?.workHours !== undefined && (
        <div className="hidden items-center gap-1 text-sm text-gray-600 dark:text-gray-400 lg:flex">
          <Clock className="h-4 w-4" />
          <span>{todayStatus.workHours.toFixed(1)}h</span>
        </div>
      )}
    </div>
  );
}

export function CheckInOutWidgetCompact() {
  const { data: todayData } = useTodayAttendance();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const todayStatus = todayData?.data;

  const handleCheckIn = async () => {
    try {
      await checkIn.mutateAsync({});
    } catch (error) {
      console.error("Check in failed:", error);
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut.mutateAsync({});
    } catch (error) {
      console.error("Check out failed:", error);
    }
  };

  const canCheckIn = !todayStatus?.hasCheckedIn;
  const canCheckOut = todayStatus?.hasCheckedIn && !todayStatus?.hasCheckedOut;

  return (
    <div className="flex items-center gap-2">
      {canCheckIn && (
        <button
          onClick={handleCheckIn}
          disabled={checkIn.isPending}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          title="Chấm công vào"
        >
          <LogIn className="h-5 w-5" />
        </button>
      )}

      {canCheckOut && (
        <button
          onClick={handleCheckOut}
          disabled={checkOut.isPending}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          title="Chấm công ra"
        >
          <LogOut className="h-5 w-5" />
        </button>
      )}

      {todayStatus?.hasCheckedIn && todayStatus?.hasCheckedOut && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
          <div className="h-3 w-3 rounded-full bg-green-500" />
        </div>
      )}
    </div>
  );
}
