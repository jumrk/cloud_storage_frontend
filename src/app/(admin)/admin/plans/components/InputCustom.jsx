import React from "react";

function InputCustom({
  id,
  label,
  errors,
  name,
  type,
  placeholder,
  value,
  handelChange,
  disabled = false,
  helper,
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          htmlFor={id}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        value={value}
        name={name}
        onChange={handelChange}
        disabled={disabled}
        className="w-full placeholder:text-slate-400 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:opacity-50 disabled:cursor-not-allowed"
        type={type}
        placeholder={placeholder}
      />
      {(errors || helper) && (
        <p className={`text-xs ${errors ? "text-rose-500" : "text-slate-400"}`}>
          {errors || helper}
        </p>
      )}
    </div>
  );
}

export default InputCustom;

