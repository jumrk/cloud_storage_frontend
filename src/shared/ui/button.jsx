"use client";
import React from "react";

function cx(...args) {
  return args.filter(Boolean).join(" ");
}

function Spinner({ className }) {
  return (
    <svg
      className={cx("animate-spin h-4 w-4", className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  );
}
export default function Button({
  children,
  type = "button",
  handleClick,
  variant = "solid",
  color = "brand",
  size = "md",
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  className,
  ...rest
}) {
  const isDisabled = disabled || loading;

  const colorMap = {
    brand: {
      solid: "bg-brand-500 hover:bg-brand-600 text-white",
      outline: "border border-brand-500 text-brand-700 hover:bg-brand-50",
      ghost: "text-brand-700 hover:bg-brand-50",
      spinner: "text-white",
    },
    accent: {
      solid: "bg-accent-500 hover:bg-accent-600 text-white",
      outline: "border border-accent-500 text-accent-700 hover:bg-accent-50",
      ghost: "text-accent-700 hover:bg-accent-50",
      spinner: "text-white",
    },
    neutral: {
      solid: "bg-slate-800 hover:bg-slate-900 text-white",
      outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
      ghost: "text-slate-700 hover:bg-slate-100",
      spinner: "text-white",
    },
    danger: {
      solid: "bg-red-600 hover:bg-red-700 text-white",
      outline: "border border-red-500 text-red-600 hover:bg-red-50",
      ghost: "text-red-600 hover:bg-red-50",
      spinner: "text-white",
    },
    success: {
      solid: "bg-green-600 hover:bg-green-700 text-white",
      outline: "border border-green-500 text-green-700 hover:bg-green-50",
      ghost: "text-green-700 hover:bg-green-50",
      spinner: "text-white",
    },
  };

  const sizeMap = {
    sm: "h-9 px-3 text-sm gap-2",
    md: "h-10 px-4 text-sm gap-2.5",
    lg: "h-12 px-5 text-base gap-3",
    xl: "h-14 px-6 text-base gap-4",
  };

  const common =
    "inline-flex items-center justify-center rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  const ringMap = {
    brand: "focus-visible:ring-brand-400",
    accent: "focus-visible:ring-accent-400",
    neutral: "focus-visible:ring-slate-300",
    danger: "focus-visible:ring-red-300",
    success: "focus-visible:ring-green-300",
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={isDisabled}
      data-loading={loading ? "true" : "false"}
      className={cx(
        common,
        sizeMap[size],
        ringMap[color],
        colorMap[color][variant],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {loading ? (
        <Spinner
          className={cx(
            variant === "solid" ? colorMap[color].spinner : "text-current"
          )}
        />
      ) : (
        leftIcon || null
      )}
      <span className="whitespace-nowrap">{children}</span>
      {!loading && rightIcon ? rightIcon : null}
    </button>
  );
}
