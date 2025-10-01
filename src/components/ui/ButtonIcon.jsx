import React from "react";

function Button_icon({
  text,
  icon,
  bg,
  draggedItems = [],
  onDropAction,
  mobile,
}) {
  const [isOver, setIsOver] = React.useState(false);
  return (
    <div
      className={`flex gap-2 items-center justify-center ${bg} text-white rounded-[12px] shadow-xl/20 transition-all duration-200 ${
        isOver ? "ring-4 ring-yellow-400 scale-105" : ""
      } ${
        mobile
          ? "w-full max-w-xs py-4 text-lg"
          : "min-w-[120px] min-h-[48px] px-4 py-2 text-base"
      }`}
      style={{
        cursor: draggedItems.length > 0 || mobile ? "pointer" : "default",
      }}
      onDragOver={(e) => {
        if (draggedItems.length > 0) {
          e.preventDefault();
          setIsOver(true);
        }
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        if ((draggedItems.length > 0 || mobile) && onDropAction) {
          onDropAction(draggedItems);
        }
      }}
      onClick={
        mobile && onDropAction ? () => onDropAction(draggedItems) : undefined
      }
    >
      <p className="font-semibold">{text}</p>
      {icon}
    </div>
  );
}

export default Button_icon;
