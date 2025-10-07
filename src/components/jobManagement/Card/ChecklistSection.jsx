"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ChecklistBlock from "./ChecklistBlock";
import SortableChecklistBlock from "@/components/jobManagement/Card/SortableChecklistBlock";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

const pct = (done, total) =>
  !total ? 0 : Math.min(100, Math.max(0, Math.round((done / total) * 100)));

export default function ChecklistSection({
  boardMembers = [],
  checklists = [],
  onRenameChecklist,
  onDeleteChecklist,
  onSave,
  moveCheckList, // (checklistId: string, pos: number) => Promise
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
      (acc, v) => ({
        done: acc.done + (v?.done || 0),
        total: acc.total + (v?.total || 0),
      }),
      { done: 0, total: 0 }
    );
    const progress = pct(sum.done, sum.total);
    if (progress !== lastProgressRef.current) {
      onSave?.({ progress });
      lastProgressRef.current = progress;
    }
  }, [counts, onSave]);

  const checklistIdsKey = useMemo(
    () => checklists.map((c) => c._id).join(","),
    [checklists]
  );
  useEffect(() => {
    setCounts({});
    lastProgressRef.current = null;
  }, [checklistIdsKey]);

  const [localList, setLocalList] = useState(checklists);
  useEffect(() => setLocalList(checklists), [checklists]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragEnd = useCallback(
    async (e) => {
      const { active, over } = e;
      if (!over || active.id === over.id) return;

      const oldIndex = localList.findIndex((x) => x._id === active.id);
      const newIndex = localList.findIndex((x) => x._id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;

      const next = arrayMove(localList, oldIndex, newIndex);
      setLocalList(next);

      const updates = next.map((x, i) => ({
        id: x._id,
        newPos: (i + 1) * 1000,
        oldPos:
          typeof x.pos === "number"
            ? x.pos
            : checklists.find((c) => c._id === x._id)?.pos ?? (i + 1) * 1000,
      }));

      const changed = updates.filter((u) => u.newPos !== u.oldPos);

      try {
        await Promise.all(changed.map((u) => moveCheckList(u.id, u.newPos)));
      } catch (err) {
        setLocalList(localList);
      }
    },
    [localList, checklists, moveCheckList]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localList.map((c) => c._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {localList.map((cl) => (
            <SortableChecklistBlock key={cl._id} id={cl._id}>
              <ChecklistBlock
                data={cl}
                members={boardMembers}
                onRename={onRenameChecklist}
                onDelete={onDeleteChecklist}
                onCountsChange={handleCountsChange}
              />
            </SortableChecklistBlock>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
