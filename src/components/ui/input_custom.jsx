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
}) {
  return (
    <div className="grid mt-5">
      <label className="text-primary/60 text-sm lg:text-xl " htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        name={name}
        onChange={handelChange}
        disabled={disabled}
        className="w-full placeholder:text-[#8897AD] p-3 border-1 focus:outline-none border-[#D4D7E3] bg-[#F7FBFF] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        type={`${type}`}
        placeholder={placeholder}
      />
      <p
        className={`text-sm text-red-400 transition-all duration-200 ease-in-out ${
          errors ? "opacity-100 max-h-10" : "opacity-0 max-h-0"
        }`}
      >
        {errors || " "}
      </p>
    </div>
  );
}

export default InputCustom;
