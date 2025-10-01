"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ChecklistBlock from "./ChecklistBlock";

const pct = (done, total) => {
  if (!total) return 0;
  const v = Math.round((done / total) * 100);
  return Math.min(100, Math.max(0, v));
};

export default function ChecklistSection({
  boardMembers = [],
  checklists = [],
  onRenameChecklist,
  onDeleteChecklist,
  onSave,
}) {
  const [counts, setCounts] = useState({});
  const lastProgressRef = useRef(null);

  const handleCountsChange = useCallback((id, c) => {
    setCounts((prev) => {
      if (prev[id]?.done === c.done && prev[id]?.total === c.total) return prev;
      return { ...prev, [id]: c };
    });
  }, []);

  useEffect(() => {
    const sum = Object.values(counts).reduce(
      (acc, v) => {
        acc.done += v?.done || 0;
        acc.total += v?.total || 0;
        return acc;
      },
      { done: 0, total: 0 }
    );
    const progress = pct(sum.done, sum.total);

    if (progress !== lastProgressRef.current) {
      onSave?.({ progress });
      lastProgressRef.current = progress;
    }
  }, [counts, onSave]);

  const checklistIds = useMemo(
    () => checklists.map((c) => c._id).join(","),
    [checklists]
  );
  useEffect(() => {
    setCounts({});
    lastProgressRef.current = null;
  }, [checklistIds]);

  return (
    <div className="space-y-3">
      {checklists.map((cl) => (
        <div key={cl._id}>
          <ChecklistBlock
            data={cl}
            members={boardMembers}
            onRename={onRenameChecklist}
            onDelete={onDeleteChecklist}
            // mỗi block báo {done,total} của riêng nó
            onCountsChange={handleCountsChange}
          />
        </div>
      ))}
    </div>
  );
}
