import React, { FC } from "react";

interface InputProps  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string; // Error message string
  success?: boolean;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  type = "text",
  id,
  name,
  placeholder,
  defaultValue,
  onChange,
  className = "",
  min,
  max,
  step,
  disabled = false,
  success = false,
  error,
  hint,
  value,
  ...rest
}, ref) => {
  const hasError = !!error;
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Format date value for type="date" input (requires yyyy-MM-dd format)
  const formatDateValue = (val: any) => {
    if (!val || type !== "date") return val;
    
    // If already in yyyy-MM-dd format, return as-is
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return val;
    }
    
    // Convert ISO string or Date object to yyyy-MM-dd
    try {
      const date = new Date(val);
      if (isNaN(date.getTime())) return val;
      return date.toISOString().split('T')[0];
    } catch {
      return val;
    }
  };

  // Use value from React Hook Form if available, otherwise defaultValue
  const currentValue = value !== undefined ? value : defaultValue;
  const formattedValue = formatDateValue(currentValue);

  // Update the actual input value when it changes (for React Hook Form compatibility)
  React.useEffect(() => {
    if (inputRef.current && type === "date" && formattedValue) {
      inputRef.current.value = formattedValue;
    }
  }, [formattedValue, type]);

  // Determine input styles based on state (disabled, success, error)
  let inputClasses = `h-10 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${className}`;

  // Add styles for the different states
  if (disabled) {
    inputClasses += ` text-gray-500 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (hasError) {
    inputClasses += ` text-error-800 border-error-500 focus:ring-3 focus:ring-error-500/10  dark:text-error-400 dark:border-error-500`;
  } else if (success) {
    inputClasses += ` text-success-500 border-success-400 focus:ring-success-500/10 focus:border-success-300  dark:text-success-400 dark:border-success-500`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`;
  }

  return (
    <div className="relative">
      <input
        ref={(el) => {
          inputRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) ref.current = el;
        }}
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        value={formattedValue}
        onChange={onChange || (() => {})}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={inputClasses}
        {...rest}
      />

      {/* Error Message */}
      {error && (
        <p className="mt-1.5 text-xs text-error-500 dark:text-error-400">
          {error}
        </p>
      )}

      {/* Optional Hint Text */}
      {hint && !error && (
        <p
          className={`mt-1.5 text-xs ${
            success ? "text-success-500" : "text-gray-500"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
