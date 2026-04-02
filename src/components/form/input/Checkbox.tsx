import React, { forwardRef } from "react";

interface CheckboxProps {
  label?: string;
  checked?: boolean;
  className?: string;
  id?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  disabled?: boolean;
  name?: string;
  ref?: React.Ref<HTMLInputElement>;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  checked,
  id,
  onChange,
  onBlur,
  className = "",
  disabled = false,
  name,
  ...rest
}, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      // Always call as event handler - works for both React Hook Form and native handlers
      (onChange as React.ChangeEventHandler<HTMLInputElement>)(e);
    }
  };

  return (
    <label
      className={`flex items-center space-x-3 group cursor-pointer ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      }`}
    >
      <div className="relative w-5 h-5">
        <input
          ref={ref}
          id={id}
          name={name}
          type="checkbox"
          className={`peer w-5 h-5 appearance-none cursor-pointer dark:border-gray-700 border border-gray-300 checked:border-transparent rounded-md checked:bg-brand-500 disabled:opacity-60
          ${className}`}
          checked={checked}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          {...rest}
        />
        {/* Checkmark icon - shown when checked via peer-checked */}
        <svg
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
        >
          <path
            d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
            stroke="white"
            strokeWidth="1.94437"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {label && (
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {label}
        </span>
      )}
    </label>
  );
});

Checkbox.displayName = "Checkbox";

export default Checkbox;
