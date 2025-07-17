import React from "react";

function Button_custom({ text, bg, onclick }) {
  return (
    <button
      onClick={onclick}
      className={`${bg} text-white cursor-pointer font-bold py-2 px-6 rounded-lg hover:scale-105 transition-all `}
    >
      {text}
    </button>
  );
}

export default Button_custom;
