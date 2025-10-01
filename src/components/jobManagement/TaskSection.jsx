"use client";
import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CardTask from "@/components/jobManagement/Card/CardTask";
function TaskSection({ title, items = [], usersMap }) {
  const scrollerRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = (el) => {
    if (!el) return;
    const start = el.scrollLeft <= 1;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    setAtStart(start);
    setAtEnd(end);
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const measure = () => {
      setHasOverflow(el.scrollWidth > el.clientWidth + 1);
      updateEdges(el);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const id = requestAnimationFrame(measure);
    const onScroll = () => updateEdges(el);
    el.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, [items.length]);

  const scrollByCards = (dir = 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.max(320, Math.floor(el.clientWidth * 0.9));
    el.scrollBy({ left: step * dir, behavior: "smooth" });
  };

  return (
    <section className="mb-2">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#888DA7]">{title}</h2>

        {hasOverflow && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              className={`h-8 w-8 cursor-pointer rounded-full border border-neutral-200 bg-white shadow-sm grid place-items-center transition
                         ${
                           atStart
                             ? "opacity-40 pointer-events-none"
                             : "hover:shadow"
                         }`}
              aria-label="Prev"
            >
              <ChevronLeft className="h-4 w-4 text-neutral-600" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCards(1)}
              className={`h-8 w-8 rounded-full cursor-pointer border border-neutral-200 bg-white shadow-sm grid place-items-center transition
                         ${
                           atEnd
                             ? "opacity-40 pointer-events-none"
                             : "hover:shadow"
                         }`}
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4 text-neutral-600" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollerRef}
        className="relative -mx-1 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
      >
        <div className="flex gap-2">
          {items.map((t) => (
            <div key={t._id} className="shrink-0 p-2 snap-start ">
              <CardTask
                cover={t.cover}
                title={t.title}
                desc={t.descText || t.priority || ""}
                progress={t.progress}
                dueDate={t.dueAt}
                members={t.assignees.map(
                  (uid) => usersMap.get(uid)?.name || "User"
                )}
              />
            </div>
          ))}
        </div>

        {hasOverflow && !atStart && (
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent" />
        )}
        {hasOverflow && !atEnd && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
        )}
      </div>
    </section>
  );
}

export default TaskSection;
