"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoClose } from "react-icons/io5";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import HardBreak from "@tiptap/extension-hard-break";
import Blockquote from "@tiptap/extension-blockquote";

export default function DescriptionPopover({
  open,
  onClose,
  valueJSON,
  onChange,
  className = "",
}) {
  const panelRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [styleMenu, setStyleMenu] = useState(false);
  const [insertMenu, setInsertMenu] = useState(false);

  useEffect(() => setMounted(true), []);

  const initialContent = useMemo(
    () => valueJSON || { type: "doc", content: [{ type: "paragraph" }] },
    [valueJSON]
  );

  const editor = useEditor({
    extensions: [
      // Để mặc định StarterKit (không tắt tính năng), sau đó add các ext bổ sung
      StarterKit.configure({ codeBlock: false }),
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList.configure({ keepMarks: true }),
      OrderedList.configure({ keepMarks: true }),
      ListItem,
      HorizontalRule,
      HardBreak.configure({ keepMarks: false }),
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
      Placeholder.configure({
        placeholder: "Viết mô tả... Gõ / để xem gợi ý.",
      }),
    ],
    content: initialContent,
    autofocus: "end",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        // Ép style danh sách để luôn có marker + padding trái
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[180px] p-3 bg-white text-neutral-800 " +
          "[&_ul]:list-disc [&_ol]:list-decimal [&_ul,&_ol]:pl-5",
      },
      handleDOMEvents: {
        mousedown: () => {
          setStyleMenu(false);
          setInsertMenu(false);
          return false;
        },
      },
    },
  });

  // Force re-render mỗi khi selection/transaction/update thay đổi
  const [, force] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const rerender = () => force((n) => n + 1);
    editor.on("selectionUpdate", rerender);
    editor.on("transaction", rerender);
    editor.on("update", rerender);
    return () => {
      editor.off("selectionUpdate", rerender);
      editor.off("transaction", rerender);
      editor.off("update", rerender);
    };
  }, [editor]);

  useEffect(() => {
    if (editor && open) editor.commands.setContent(initialContent, false);
  }, [editor, open, initialContent]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  const isActive = (name, attrs) => editor?.isActive(name, attrs);

  const IconBtn = ({ onClick, active, title, children, disabled }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={[
        "h-8 px-2 rounded-md text-sm",
        "border border-neutral-300 hover:bg-neutral-100",
        active ? "bg-neutral-200 ring-1 ring-neutral-300" : "bg-white",
        "text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed",
        "transition",
      ].join(" ")}
    >
      {children}
    </button>
  );

  const save = () => {
    const json = editor?.getJSON();
    onChange?.(json);
    onClose?.();
  };

  const clear = () => editor?.commands.clearContent(true);

  if (!mounted || !open) return null;

  const styleLabel = (() => {
    if (isActive("heading", { level: 1 })) return "H1";
    if (isActive("heading", { level: 2 })) return "H2";
    if (isActive("heading", { level: 3 })) return "H3";
    return "Aa";
  })();

  const applyLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link")?.href || "";
    const url = prompt("Nhập URL:", prev || "https://");
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: trimmed })
      .run();
  };

  return (
    <div
      ref={panelRef}
      className={`rounded-2xl border border-neutral-200 bg-white ${className}`}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Mô tả"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200">
        <span className="font-medium text-neutral-800">Mô tả</span>
        <button
          className="p-1 rounded-md hover:bg-neutral-100 text-neutral-700"
          onClick={onClose}
          aria-label="Đóng"
        >
          <IoClose size={16} />
        </button>
      </div>

      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 flex-wrap text-neutral-800">
          <div className="relative">
            <IconBtn
              title="Kiểu đoạn (Paragraph/H1/H2/H3)"
              active={isActive("heading")}
              onClick={() => {
                setStyleMenu((v) => !v);
                setInsertMenu(false);
              }}
            >
              {styleLabel} ▾
            </IconBtn>
            {styleMenu && (
              <div className="absolute mt-2 w-44 rounded-lg border border-neutral-200 bg-white shadow-xl overflow-hidden z-10">
                <button
                  className={`block w-full text-left px-3 py-2 ${
                    editor?.isActive("paragraph") &&
                    !editor?.isActive("heading")
                      ? "bg-neutral-200"
                      : "hover:bg-neutral-100"
                  }`}
                  onClick={() => {
                    editor?.chain().focus().setParagraph().run();
                    setStyleMenu(false);
                  }}
                  disabled={!editor?.can().chain().focus().setParagraph().run()}
                >
                  Paragraph
                </button>
                <button
                  className={`block w-full text-left px-3 py-2 ${
                    editor?.isActive("heading", { level: 1 })
                      ? "bg-neutral-200"
                      : "hover:bg-neutral-100"
                  }`}
                  onClick={() => {
                    editor?.chain().focus().toggleHeading({ level: 1 }).run();
                    setStyleMenu(false);
                  }}
                  disabled={
                    !editor
                      ?.can()
                      .chain()
                      .focus()
                      .toggleHeading({ level: 1 })
                      .run()
                  }
                >
                  Heading 1
                </button>
                <button
                  className={`block w-full text-left px-3 py-2 ${
                    editor?.isActive("heading", { level: 2 })
                      ? "bg-neutral-200"
                      : "hover:bg-neutral-100"
                  }`}
                  onClick={() => {
                    editor?.chain().focus().toggleHeading({ level: 2 }).run();
                    setStyleMenu(false);
                  }}
                  disabled={
                    !editor
                      ?.can()
                      .chain()
                      .focus()
                      .toggleHeading({ level: 2 })
                      .run()
                  }
                >
                  Heading 2
                </button>
                <button
                  className={`block w-full text-left px-3 py-2 ${
                    editor?.isActive("heading", { level: 3 })
                      ? "bg-neutral-200"
                      : "hover:bg-neutral-100"
                  }`}
                  onClick={() => {
                    editor?.chain().focus().toggleHeading({ level: 3 }).run();
                    setStyleMenu(false);
                  }}
                  disabled={
                    !editor
                      ?.can()
                      .chain()
                      .focus()
                      .toggleHeading({ level: 3 })
                      .run()
                  }
                >
                  Heading 3
                </button>
              </div>
            )}
          </div>

          <span className="h-6 w-px bg-neutral-200" />

          <IconBtn
            title="Đậm"
            active={isActive("bold")}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            disabled={!editor?.can().chain().focus().toggleBold().run()}
          >
            B
          </IconBtn>
          <IconBtn
            title="Nghiêng"
            active={isActive("italic")}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            disabled={!editor?.can().chain().focus().toggleItalic().run()}
          >
            I
          </IconBtn>
          <IconBtn
            title="Gạch chân"
            active={isActive("underline")}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            disabled={!editor?.can().chain().focus().toggleUnderline().run()}
          >
            U
          </IconBtn>
          <IconBtn
            title="Gạch ngang"
            active={isActive("strike")}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            disabled={!editor?.can().chain().focus().toggleStrike().run()}
          >
            S
          </IconBtn>

          <span className="h-6 w-px bg-neutral-200" />

          <IconBtn
            title="Danh sách chấm"
            active={isActive("bulletList")}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            disabled={!editor?.can().chain().focus().toggleBulletList().run()}
          >
            •
          </IconBtn>
          <IconBtn
            title="Danh sách số"
            active={isActive("orderedList")}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            disabled={!editor?.can().chain().focus().toggleOrderedList().run()}
          >
            1.
          </IconBtn>

          <span className="h-6 w-px bg-neutral-200" />

          <IconBtn
            title="Trích dẫn"
            active={isActive("blockquote")}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            disabled={!editor?.can().chain().focus().toggleBlockquote().run()}
          >
            ❝❞
          </IconBtn>

          <span className="h-6 w-px bg-neutral-200" />

          <IconBtn
            title="Liên kết"
            active={isActive("link")}
            onClick={applyLink}
            disabled={
              !editor
                ?.can()
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: "https://" })
                .run()
            }
          >
            🔗
          </IconBtn>
          <IconBtn
            title="Bỏ liên kết"
            onClick={() => editor?.chain().focus().unsetLink().run()}
            disabled={!editor?.can().chain().focus().unsetLink().run()}
          >
            ⨯
          </IconBtn>

          <span className="h-6 w-px bg-neutral-200" />

          <IconBtn
            title="Inline code"
            active={isActive("code")}
            onClick={() => editor?.chain().focus().toggleCode().run()}
            disabled={!editor?.can().chain().focus().toggleCode().run()}
          >
            {"</>"}
          </IconBtn>
        </div>
      </div>

      <div className="pt-2">
        <div className="mx-3 rounded-xl border border-neutral-200 bg-white overflow-hidden">
          {editor && <EditorContent editor={editor} key="desc-editor" />}
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-3">
        <button
          onClick={save}
          className="h-9 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-sm"
        >
          Lưu
        </button>
        <button
          onClick={onClose}
          className="h-9 px-4 rounded-lg border border-neutral-300 text-neutral-700 text-sm bg-white hover:bg-neutral-100"
        >
          Hủy
        </button>
        <div className="flex-1" />
        <button
          onClick={clear}
          className="h-9 px-3 rounded-lg border border-neutral-300 text-neutral-600 text-sm bg-white hover:bg-neutral-100"
          title="Xóa nhanh nội dung"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
