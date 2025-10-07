import checklistService from "@/lib/services/jobManagement/checkListService";
import { useRef, useState } from "react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import HardBreak from "@tiptap/extension-hard-break";
import Blockquote from "@tiptap/extension-blockquote";
import toast from "react-hot-toast";
import { generateHTML } from "@tiptap/html";
import commentService from "@/lib/services/jobManagement/commentService";

const HTML_EXTS = [
  StarterKit.configure({ codeBlock: false }),
  Heading.configure({ levels: [1, 2, 3] }),
  BulletList.configure({ keepMarks: true }),
  OrderedList.configure({ keepMarks: true }),
  ListItem,
  HorizontalRule,
  HardBreak,
  Blockquote,
  Underline,
  Link.configure({
    autolink: true,
    openOnClick: true,
    linkOnPaste: true,
    HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
    protocols: ["http", "https", "mailto", "tel"],
  }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
];
export default function useModalDetailCardTask(card, onSave, boardMembers) {
  const COLOR_PALETTE = [
    "#16a34a",
    "#a16207",
    "#ea580c",
    "#dc2626",
    "#7c3aed",
    "#2563eb",
    "#0d9488",
    "#0891b2",
    "#6b7280",
    "#111827",
  ];
  //service
  const { getChecklists, createChecklist, deleteChecklist, updateChecklist } =
    checklistService();
  const { createComment, deleteComment, getCommentsByCard, updateComment } =
    commentService();
  // state
  const [editingTitle, setEditingTitle] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [dueOpen, setDueOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [addingChecklist, setAddingChecklist] = useState(false);
  const [titleDraft, setTitleDraft] = useState(card?.title ?? "");

  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [checkList, setCheckList] = useState([]);

  const [comment, setComment] = useState([]);
  const [addComment, setAddComment] = useState("");

  const titleInputRef = useRef(null);
  const savingRef = useRef(false);
  const cardId = card?._id;
  //has
  const labelColors = Array.isArray(card?.labels)
    ? card.labels
    : card?.labelColors || [];
  const memberIds = toIdArray(card?.members);
  const dueAt = card?.dueAt ?? null;
  const descDoc = card?.descDoc || null;
  const hasLabels = labelColors.length > 0;
  const hasMembers = memberIds.length > 0;
  const hasDue = Boolean(dueAt);
  const hasDescription = Boolean(descDoc?.content?.length);
  const showAnyQuick = !hasLabels || !hasMembers || !hasDue;

  const previewHtml =
    card?.descHtmlCached && card.descHtmlCached.trim().length
      ? card.descHtmlCached
      : hasDescription
      ? generateHTML(descDoc, HTML_EXTS)
      : "";

  // Checklist
  const fetchCheckList = async () => {
    try {
      const res = await getChecklists(cardId);
      const payload = res?.data;
      if (!payload.success) {
        toast.error(payload.messenger || "Không lấy được danh sách");
        return;
      }
      const list = Array.isArray(payload.data) ? payload.data : [];
      setCheckList(list);
    } catch (error) {
      const msg = error?.response?.data?.messenger || "Lỗi";
      toast.error(msg);
    }
  };

  const handleCreateCheckList = async () => {
    try {
      const res = await createChecklist(cardId, newChecklistTitle);
      const payload = res?.data;
      if (!payload?.success) {
        toast.error(payload?.messenger);
        return;
      }
      const result = payload.data;
      setCheckList((prev) => [result, ...prev]);
      toast.success("Thêm thành công");
      setNewChecklistTitle("");
      setAddingChecklist(false);
    } catch (error) {
      const msg = error?.response?.data?.messenger || "Lỗi";
      toast.error(msg);
    }
  };
  const handleDeleteCheckList = async (checklistId) => {
    try {
      const res = await deleteChecklist(checklistId);
      const payload = res?.data;
      if (!payload.success) {
        toast.error(payload?.messenger || "Lỗi không thể xóa");
        return;
      }
      setCheckList((prev) => prev.filter((c) => c._id !== checklistId));
      toast.success("Xóa thành công");
    } catch (error) {
      const msg = error?.response?.data?.messenger || "Lỗi";
      toast.error(msg);
    }
  };
  const handleUpdateChecklist = async (checklistId, title) => {
    try {
      const res = await updateChecklist(checklistId, { title });
      const payload = res?.data;
      if (!payload.success) {
        toast.error(payload?.messenger || "Lỗi không thể sửa");
        return;
      }
      const data = payload.data;
      setCheckList((prev) =>
        prev.map((c) => (c._id === checklistId ? { ...c, ...data } : c))
      );
    } catch (error) {
      const msg = error?.response?.data?.messenger || "Lỗi";
      toast.error(msg);
    }
  };
  const moveCheckList = async (checklistId, pos) => {
    try {
      const res = await updateChecklist(checklistId, { pos });
      const payload = res?.data;
      if (!payload.success) {
        toast.error(payload?.messenger || "Lỗi không thể sửa");
        return;
      }
    } catch (error) {
      const msg = error?.response?.data?.messenger || "Lỗi";
      toast.error(msg);
    }
  };

  // Comment
  const fetchComment = async () => {
    try {
      const res = await getCommentsByCard(cardId);
      const payload = res?.data;
      if (!payload.success) {
        toast.error(payload.messenger || "Không lấy được danh sách");
        return;
      }
      const list = Array.isArray(payload.data) ? payload.data : [];
      setComment(list);
    } catch (error) {
      const msg = error?.response?.data?.messenger || "Lỗi";
      toast.error(msg);
    }
  };
  const handleAddComment = async (e) => {
    e?.preventDefault();
    try {
      const res = await createComment(cardId, addComment);
      const payload = res?.data;
      if (!payload?.success) {
        toast.error(payload?.messenger);
        return;
      }
      const result = payload.data;
      setComment((prev) => [result, ...prev]);
      toast.success("Thêm thành công");
      setAddComment("");
    } catch (error) {
      const msg = error?.response?.data?.messenger || "Lỗi";
      toast.error(msg);
    }
  };
  const handleDeleteComment = async (commentId) => {
    try {
      const res = await deleteComment(commentId);
      const payload = res?.data;
      if (!payload.success) {
        toast.error(payload?.messenger || "Lỗi không thể xóa");
        return;
      }
      setComment((prev) => prev.filter((c) => c._id !== commentId));
      toast.success("Xóa thành công");
    } catch (error) {
      const msg = error?.response?.data?.messenger || "Lỗi";
      toast.error(msg);
    }
  };
  const handleUpdateComment = async (commentId, text) => {
    try {
      const res = await updateComment(commentId, { text });
      const payload = res?.data;
      if (!payload.success) {
        toast.error(payload?.messenger || "Lỗi không thể sửa");
        return;
      }
      const data = payload.data;
      setComment((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, ...data } : c))
      );
    } catch (error) {
      const msg = error?.response?.data?.messenger || "Lỗi";
      toast.error(msg);
    }
  };

  function plainTextFromJSON(json) {
    try {
      const walk = (n) => {
        if (!n) return "";
        if (n.type === "text") return n.text || "";
        const kids = n.content || [];
        return kids.map(walk).join(" ");
      };
      return (walk(json) || "").replace(/\s+/g, " ").trim();
    } catch {
      return "";
    }
  }

  function toIdArray(arr) {
    if (!Array.isArray(arr)) return [];
    const out = [];
    const seen = new Set();
    for (const v of arr) {
      const id =
        typeof v === "string"
          ? v
          : v && (v._id || v.id)
          ? String(v._id || v.id)
          : null;
      if (id && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
    return out;
  }

  const commitTitle = async () => {
    if (savingRef.current) return;
    const next = (titleDraft || "").trim();
    if (!next || next === (card?.title ?? "")) {
      setEditingTitle(false);
      return;
    }
    try {
      savingRef.current = true;
      await onSave?.({ title: next });
      setEditingTitle(false);
    } finally {
      savingRef.current = false;
    }
  };
  const renderLabelChips = () =>
    labelColors.map((c) => (
      <span
        key={c}
        className="inline-flex h-7 items-center rounded-md px-3 text-white text-xs"
        style={{ backgroundColor: c }}
        title={c}
      >
        {c}
      </span>
    ));

  const renderMemberChips = () =>
    Array.isArray(boardMembers)
      ? boardMembers
          .filter((m) => memberIds.includes(m.id))
          .map((m) => (
            <span
              key={m.id}
              className="inline-flex h-7 items-center rounded-full px-2 bg-neutral-200 text-neutral-800 text-xs"
              title={m.fullName}
            >
              {m.fullName?.slice(0, 1).toUpperCase()}
            </span>
          ))
      : null;

  const formatDueBadge = () => {
    try {
      if (!dueAt) return "";
      const d = new Date(dueAt);
      const hh = d.getHours().toString().padStart(2, "0");
      const mm = d.getMinutes().toString().padStart(2, "0");
      const day = d.getDate();
      const month = d.getMonth() + 1;
      return `${hh}:${mm} ${day} thg ${month}`;
    } catch {
      return "";
    }
  };

  const handleSaveDescription = async (json) => {
    const html = generateHTML(json || { type: "doc", content: [] }, HTML_EXTS);
    const text = plainTextFromJSON(json);
    await onSave?.({
      descFormat: "tiptap",
      descDoc: json,
      descHtmlCached: html,
      descText: text,
    });
    setDescOpen(false);
  };
  return {
    COLOR_PALETTE,
    memberIds,
    editingTitle,
    titleDraft,
    hasMembers,
    titleInputRef,
    labelColors,
    labelsOpen,
    dueAt,
    dueOpen,
    membersOpen,
    addComment,
    descOpen,
    addingChecklist,
    descDoc,
    hasLabels,
    hasDue,
    hasDescription,
    showAnyQuick,
    newChecklistTitle,
    checkList,
    previewHtml,
    comment,
    setEditingTitle,
    setTitleDraft,
    commitTitle,
    setLabelsOpen,
    setDueOpen,
    setMembersOpen,
    setDescOpen,
    setNewChecklistTitle,
    setAddingChecklist,
    renderLabelChips,
    renderMemberChips,
    formatDueBadge,
    handleSaveDescription,
    fetchCheckList,
    handleCreateCheckList,
    handleDeleteCheckList,
    handleUpdateChecklist,
    fetchComment,
    handleAddComment,
    handleDeleteComment,
    handleUpdateComment,
    setAddComment,
    moveCheckList,
  };
}
