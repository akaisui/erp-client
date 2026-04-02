"use client";

import React, { useRef, useEffect, useState } from "react";
import flatpickr from "flatpickr";
import monthSelectPlugin from "flatpickr/dist/plugins/monthSelect/index.js";
import "flatpickr/dist/flatpickr.min.css";
import "flatpickr/dist/plugins/monthSelect/style.css";
import { cn } from "@/lib/utils";

// Compact month picker styling
const monthPickerStyles = `
  .flatpickr-calendar.monthSelectPlugin {
    width: 250px !important;
    height: auto !important;
  }
  .flatpickr-calendar.monthSelectPlugin .flatpickr-innerContainer {
    max-height: 300px;
  }
  .flatpickr-monthSelect-month {
    padding: 6px !important;
    font-size: 13px !important;
  }
`;

if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.textContent = monthPickerStyles;
  document.head.appendChild(style);
}

interface MonthPickerProps {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  minDate?: string | Date;
  maxDate?: string | Date;
}

export function MonthPicker({
  value,
  onChange,
  placeholder = "Chọn tháng",
  disabled = false,
  className,
  error,
  minDate,
  maxDate,
}: MonthPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const flatpickrInstance = useRef<flatpickr.Instance | null>(null);
  const [displayValue, setDisplayValue] = useState(value || "");

  useEffect(() => {
    if (inputRef.current && !flatpickrInstance.current) {
      flatpickrInstance.current = flatpickr(inputRef.current, {
        mode: "single",
        plugins: [monthSelectPlugin({ shorthand: false, dateFormat: "Y-m" })],
        enableTime: false,
        dateFormat: "Y-m",
        minDate: minDate,
        maxDate: maxDate,
        onChange: (selectedDates, dateStr) => {
          setDisplayValue(dateStr);
          onChange(dateStr);
        },
        locale: {
          firstDayOfWeek: 1,
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

  useEffect(() => {
    if (flatpickrInstance.current) {
      if (value) {
        if (value !== displayValue) {
          flatpickrInstance.current.setDate(value, false);
          setDisplayValue(value);
        }
      } else {
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
            "w-full rounded-lg border px-3 py-1.5 text-sm transition-colors",
            "border-gray-300 bg-white text-gray-900",
            "placeholder:text-gray-400",
            "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
            "dark:focus:border-blue-400 dark:focus:ring-blue-400",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:border-gray-600 dark:bg-gray-700 dark:text-white",
            "dark:placeholder:text-gray-500",
            error && "border-red-500",
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
