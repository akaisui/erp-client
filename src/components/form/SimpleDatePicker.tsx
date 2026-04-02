"use client";

import React, { useEffect, useRef, useState } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { cn } from "@/lib/utils";

interface SimpleDatePickerProps {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  minDate?: string | Date;
  maxDate?: string | Date;
}

export function SimpleDatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày",
  disabled = false,
  className,
  error,
  minDate,
  maxDate,
}: SimpleDatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const flatpickrInstance = useRef<flatpickr.Instance | null>(null);
  const [displayValue, setDisplayValue] = useState(value || "");

  useEffect(() => {
    if (inputRef.current && !flatpickrInstance.current) {
      flatpickrInstance.current = flatpickr(inputRef.current, {
        mode: "single",
        enableTime: false,
        dateFormat: "Y-m-d",
        minDate: minDate,
        maxDate: maxDate,
        onChange: (selectedDates, dateStr) => {
          setDisplayValue(dateStr);
          onChange(dateStr);
        },
        locale: {
          firstDayOfWeek: 1,
          weekdays: {
            shorthand: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
            longhand: [
              "Chủ nhật",
              "Thứ hai",
              "Thứ ba",
              "Thứ tư",
              "Thứ năm",
              "Thứ sáu",
              "Thứ bảy",
            ],
          },
          months: {
            shorthand: [
              "Th1",
              "Th2",
              "Th3",
              "Th4",
              "Th5",
              "Th6",
              "Th7",
              "Th8",
              "Th9",
              "Th10",
              "Th11",
              "Th12",
            ],
            longhand: [
              "Tháng 1",
              "Tháng 2",
              "Tháng 3",
              "Tháng 4",
              "Tháng 5",
              "Tháng 6",
              "Tháng 7",
              "Tháng 8",
              "Tháng 9",
              "Tháng 10",
              "Tháng 11",
              "Tháng 12",
            ],
          },
        },
      });

      // Set initial value if provided
      if (value && flatpickrInstance.current) {
        flatpickrInstance.current.setDate(value, false);
        setDisplayValue(value);
      }
    }

    return () => {
      if (flatpickrInstance.current) {
        flatpickrInstance.current.destroy();
        flatpickrInstance.current = null;
      }
    };
  }, [minDate, maxDate]);

  // Sync external value changes without re-initializing
  useEffect(() => {
    if (flatpickrInstance.current) {
      if (value) {
        if (value !== displayValue) {
          flatpickrInstance.current.setDate(value, false);
          setDisplayValue(value);
        }
      } else {
        // Clear the date picker when value is empty
        flatpickrInstance.current.clear();
        setDisplayValue("");
      }
    }
  }, [value]);

  return (
    <div className="w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none",
            "border-gray-300 bg-white text-gray-900",
            "placeholder:text-gray-400",
            "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-gray-600 dark:bg-gray-700 dark:text-white",
            "dark:placeholder:text-gray-500",
            "dark:focus:border-blue-400",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg
            className="h-4 w-4 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
