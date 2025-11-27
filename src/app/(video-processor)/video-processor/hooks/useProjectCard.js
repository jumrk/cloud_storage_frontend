import { useEffect, useState } from "react";

export default function useProjectCard({ item, onRename }) {
  const [openEdit, setOpenEdit] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [title, setTitle] = useState(item?.title || "");

  // Click outside handler for menu
  useEffect(() => {
    const h = (e) => {
      if (
        !e.target.closest?.("[data-card-menu]") &&
        !e.target.closest?.("[data-popover-panel]")
      ) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("click", h);
    return () => window.removeEventListener("click", h);
  }, []);

  // Reset title when item changes
  useEffect(() => {
    setTitle(item?.title || "");
  }, [item?.title]);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setMenuOpen((v) => !v);
  };

  const handleEditClick = () => {
    setMenuOpen(false);
    setTitle(item?.title || "");
    setOpenEdit(true);
  };

  const handleDeleteClick = () => {
    setMenuOpen(false);
  };

  const handleCloseEdit = () => {
    setOpenEdit(false);
  };

  const submitRename = async (e) => {
    e?.preventDefault?.();
    if (!title.trim()) return;
    await onRename?.(item, title.trim());
    setOpenEdit(false);
  };

  return {
    openEdit,
    menuOpen,
    title,
    setTitle,
    handleMenuClick,
    handleEditClick,
    handleDeleteClick,
    handleCloseEdit,
    submitRename,
  };
}

