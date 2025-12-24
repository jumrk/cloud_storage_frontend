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
      className={`flex gap-1 sm:gap-2 items-center justify-center ${bg} text-white rounded-[12px] shadow-xl/20 transition-all duration-200 pointer-events-auto ${
        isOver ? "ring-4 ring-yellow-400 scale-105" : ""
      } ${
        mobile
          ? "w-full max-w-xs py-4 text-lg"
          : "min-w-[80px] sm:min-w-[100px] md:min-w-[120px] min-h-[40px] sm:min-h-[44px] md:min-h-[48px] px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base"
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
      <p className="font-semibold hidden sm:inline">{text}</p>
      <span className="sm:ml-0">{icon}</span>
    </div>
  );
}

export default Button_icon;
