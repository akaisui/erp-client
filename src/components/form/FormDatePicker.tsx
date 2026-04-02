"use client";

import React from "react";
import { Controller, Control, FieldValues, Path } from "react-hook-form";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { cn } from "@/lib/utils";

interface FormDatePickerProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  mode?: "single" | "range";
  enableTime?: boolean;
  dateFormat?: string;
  minDate?: string | Date;
  maxDate?: string | Date;
  className?: string;
}

export function FormDatePicker<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "Chọn ngày",
  required = false,
  disabled = false,
  error,
  mode = "single",
  enableTime = false,
  dateFormat,
  minDate,
  maxDate,
  className,
}: FormDatePickerProps<T>) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const flatpickrInstance = React.useRef<flatpickr.Instance | null>(null);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        React.useEffect(() => {
          if (inputRef.current && !flatpickrInstance.current) {
            flatpickrInstance.current = flatpickr(inputRef.current, {
              mode: mode,
              enableTime: enableTime,
              dateFormat: dateFormat || (enableTime ? "Y-m-d H:i" : "Y-m-d"),
              minDate: minDate,
              maxDate: maxDate,
              defaultDate: field.value,
              onChange: (selectedDates, dateStr) => {
                if (mode === "single") {
                  field.onChange(dateStr);
                } else {
                  field.onChange(selectedDates);
                }
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
          }

          return () => {
            if (flatpickrInstance.current) {
              flatpickrInstance.current.destroy();
              flatpickrInstance.current = null;
            }
          };
        }, []);

        // Sync external value changes (from setValue)
        React.useEffect(() => {
          if (flatpickrInstance.current && field.value) {
            flatpickrInstance.current.setDate(field.value, false);
          }
        }, [field.value]);

        return (
          <div className="w-full">
            {label && (
              <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors",
                  "border-gray-300 bg-white text-gray-900",
                  "placeholder:text-gray-400",
                  "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "dark:border-gray-600 dark:bg-gray-800 dark:text-white",
                  "dark:placeholder:text-gray-500",
                  "dark:focus:border-blue-400",
                  error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                  className
                )}
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg
                  className="h-5 w-5 text-gray-400"
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
            {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          </div>
        );
      }}
    />
  );
}
