import React from "react";

export default function DragPreview({ draggedItems }) {
  if (!draggedItems || draggedItems.length === 0) return null;
  const isMulti = draggedItems.length > 1;
  const first = draggedItems[0];
  return (
    <div
      style={{
        padding: "10px 18px",
        background: "#2563eb",
        color: "white",
        borderRadius: 12,
        fontWeight: 600,
        fontSize: 16,
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 120,
        pointerEvents: "none",
      }}
    >
      <span style={{ fontSize: 22, marginRight: 8 }}>
        {first.type === "folder" ? "📁" : "📄"}
      </span>
      {isMulti ? (
        <span>Kéo {draggedItems.length} mục</span>
      ) : (
        <span>{first.name}</span>
      )}
    </div>
  );
}
