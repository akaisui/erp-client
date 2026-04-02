import React, { forwardRef } from "react";

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  children: React.ReactNode;
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ error, children, className = "", ...props }, ref) => {
    return (
      <div>
        <select
          ref={ref}
          className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

SelectField.displayName = "SelectField";

export default SelectField;
