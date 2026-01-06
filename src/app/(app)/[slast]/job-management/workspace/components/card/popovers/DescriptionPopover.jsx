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
import { useTranslations } from "next-intl";
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
  const t = useTranslations();
  useEffect(() => setMounted(true), []);
  const initialContent = useMemo(
    () => valueJSON || { type: "doc", content: [{ type: "paragraph" }] },
    [valueJSON]
  );
  const editor = useEditor({
    extensions: [
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
        placeholder: t(
          "job_management.description.write_description_placeholder"
        ),
      }),
    ],
    content: initialContent,
    autofocus: "end",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[180px] p-3 bg-white text-gray-900" +
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
        "border border-gray-200 hover:bg-white",
        active ? "bg-white ring-1 ring-border" : "bg-white",
        "text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed",
        "transition",
      ].join("")}
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
    const url = prompt(
      t("job_management.description.enter_url"),
      prev || "https://"
    );
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
      className={`rounded-2xl border border-gray-200 bg-white ${className}`}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={t("job_management.board.description")}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <span className="font-medium text-gray-900">
          {t("job_management.board.description")}
        </span>
        <button
          className="p-1 rounded-md hover:bg-white text-gray-600"
          onClick={onClose}
          aria-label={t("job_management.description.close")}
        >
          <IoClose size={16} />
        </button>
      </div>
      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 flex-wrap text-gray-900">
          <div className="relative">
            <IconBtn
              title={t("job_management.description.paragraph_style")}
              active={isActive("heading")}
              onClick={() => {
                setStyleMenu((v) => !v);
                setInsertMenu(false);
              }}
            >
              {styleLabel} ▾
            </IconBtn>
            {styleMenu && (
              <div className="absolute mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-xl overflow-hidden z-10">
                <button
                  className={`block w-full text-left px-3 py-2 ${
                    editor?.isActive("paragraph") &&
                    !editor?.isActive("heading")
                      ? "bg-white"
                      : "hover:bg-white"
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
                      ? "bg-white"
                      : "hover:bg-white"
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
                      ? "bg-white"
                      : "hover:bg-white"
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
                      ? "bg-white"
                      : "hover:bg-white"
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
          <span className="h-6 w-px bg-border" />
          <IconBtn
            title={t("job_management.description.bold")}
            active={isActive("bold")}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            disabled={!editor?.can().chain().focus().toggleBold().run()}
          >
            B
          </IconBtn>
          <IconBtn
            title={t("job_management.description.italic")}
            active={isActive("italic")}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            disabled={!editor?.can().chain().focus().toggleItalic().run()}
          >
            I
          </IconBtn>
          <IconBtn
            title={t("job_management.description.underline")}
            active={isActive("underline")}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            disabled={!editor?.can().chain().focus().toggleUnderline().run()}
          >
            U
          </IconBtn>
          <IconBtn
            title={t("job_management.description.strikethrough")}
            active={isActive("strike")}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            disabled={!editor?.can().chain().focus().toggleStrike().run()}
          >
            S
          </IconBtn>
          <span className="h-6 w-px bg-border" />
          <IconBtn
            title={t("job_management.description.bullet_list")}
            active={isActive("bulletList")}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            disabled={!editor?.can().chain().focus().toggleBulletList().run()}
          >
            •
          </IconBtn>
          <IconBtn
            title={t("job_management.board.numbered_list")}
            active={isActive("orderedList")}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            disabled={!editor?.can().chain().focus().toggleOrderedList().run()}
          >
            1.
          </IconBtn>
          <span className="h-6 w-px bg-border" />
          <IconBtn
            title={t("job_management.description.blockquote")}
            active={isActive("blockquote")}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            disabled={!editor?.can().chain().focus().toggleBlockquote().run()}
          >
            ❝❞
          </IconBtn>
          <span className="h-6 w-px bg-border" />
          <IconBtn
            title={t("job_management.description.link")}
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
            title={t("job_management.description.unlink")}
            onClick={() => editor?.chain().focus().unsetLink().run()}
            disabled={!editor?.can().chain().focus().unsetLink().run()}
          >
            ⨯
          </IconBtn>
          <span className="h-6 w-px bg-border" />
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
        <div className="mx-3 rounded-xl border border-gray-200 bg-white overflow-hidden">
          {editor && <EditorContent editor={editor} key="desc-editor" />}
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-3">
        <button
          onClick={save}
          className="h-9 px-4 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm"
        >
          {t("job_management.modal.save")}
        </button>
        <button
          onClick={onClose}
          className="h-9 px-4 rounded-lg border border-gray-200 text-gray-900 text-sm bg-white hover:bg-white"
        >
          {t("job_management.modal.cancel")}
        </button>
        <div className="flex-1" />
        <button
          onClick={clear}
          className="h-9 px-3 rounded-lg border border-gray-200 text-gray-600 text-sm bg-white hover:bg-white"
          title={t("job_management.description.clear_content")}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
