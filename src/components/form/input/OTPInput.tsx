"use client";

import React, { useRef, useState, KeyboardEvent, ClipboardEvent } from "react";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  autoFocus?: boolean;
}

const OTPInput = React.forwardRef<HTMLDivElement, OTPInputProps>(
  ({ length = 6, value, onChange, disabled = false, error, autoFocus = true }, ref) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(autoFocus ? 0 : null);

    // Initialize refs array
    if (inputRefs.current.length !== length) {
      inputRefs.current = Array(length)
        .fill(null)
        .map((_, i) => inputRefs.current[i] || null);
    }

    // Split value into array of digits
    const digits = value.split("").slice(0, length);
    while (digits.length < length) {
      digits.push("");
    }

    const focusInput = (index: number) => {
      if (index >= 0 && index < length) {
        inputRefs.current[index]?.focus();
        setFocusedIndex(index);
      }
    };

    const handleChange = (index: number, newValue: string) => {
      // Only allow digits
      const sanitized = newValue.replace(/[^0-9]/g, "");

      if (sanitized.length === 0) {
        // Delete current digit
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join(""));
        return;
      }

      if (sanitized.length === 1) {
        // Single digit input
        const newDigits = [...digits];
        newDigits[index] = sanitized;
        onChange(newDigits.join(""));

        // Auto focus next input
        if (index < length - 1) {
          focusInput(index + 1);
        }
      } else if (sanitized.length > 1) {
        // Multiple digits (paste)
        const newDigits = sanitized.split("").slice(0, length);
        while (newDigits.length < length) {
          newDigits.push("");
        }
        onChange(newDigits.join(""));

        // Focus last filled input or next empty
        const nextIndex = Math.min(sanitized.length, length - 1);
        focusInput(nextIndex);
      }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();

        if (digits[index]) {
          // Clear current digit
          const newDigits = [...digits];
          newDigits[index] = "";
          onChange(newDigits.join(""));
        } else if (index > 0) {
          // Move to previous input and clear it
          const newDigits = [...digits];
          newDigits[index - 1] = "";
          onChange(newDigits.join(""));
          focusInput(index - 1);
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusInput(index - 1);
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault();
        focusInput(index + 1);
      } else if (e.key === "Delete") {
        e.preventDefault();
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join(""));
      }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text");
      const sanitized = pastedData.replace(/[^0-9]/g, "");

      if (sanitized) {
        const newDigits = sanitized.split("").slice(0, length);
        while (newDigits.length < length) {
          newDigits.push("");
        }
        onChange(newDigits.join(""));

        // Focus last filled input
        const nextIndex = Math.min(sanitized.length, length - 1);
        focusInput(nextIndex);
      }
    };

    React.useEffect(() => {
      if (autoFocus && inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, [autoFocus]);

    return (
      <div ref={ref} className="w-full">
        <div className="flex gap-2 justify-center" dir="ltr">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              disabled={disabled}
              className={`
                w-12 h-14 text-center text-2xl font-bold rounded-lg border-2
                transition-all duration-200
                focus:outline-none focus:ring-2
                ${
                  error
                    ? "border-error-500 text-error-800 focus:ring-error-500/20 dark:border-error-500 dark:text-error-400"
                    : focusedIndex === index
                    ? "border-brand-500 bg-brand-50 focus:ring-brand-500/20 dark:border-brand-600 dark:bg-brand-950"
                    : digit
                    ? "border-success-400 bg-success-50 dark:border-success-600 dark:bg-success-950"
                    : "border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900"
                }
                ${
                  disabled
                    ? "cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-800"
                    : "hover:border-brand-400 dark:hover:border-brand-700"
                }
                dark:text-white
              `}
            />
          ))}
        </div>

        {error && (
          <p className="mt-2 text-sm text-error-500 dark:text-error-400 text-center">
            {error}
          </p>
        )}
      </div>
    );
  }
);

OTPInput.displayName = "OTPInput";

export default OTPInput;
