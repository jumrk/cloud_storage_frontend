"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import axiosClient from "@/lib/axiosClient";
import { useTranslations } from "next-intl";

export default function useHomeTableActions({ data = [], setData }) {
  const t = useTranslations();
  const [selectedItems, setSelectedItems] = useState([]);
  const [draggedItems, setDraggedItems] = useState([]);

  // Chọn/bỏ chọn 1 item
  const handleSelectItem = (item) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      if (exists) return prev.filter((i) => i.id !== item.id);
      return [...prev, item];
    });
  };
  // Chọn/bỏ chọn tất cả
  const handleSelectAll = () => {
    if (selectedItems.length === data.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(data);
    }
  };
  // Drag
  const handleDragStart = (item) => {
    if (selectedItems.find((i) => i.id === item.id)) {
      setDraggedItems(selectedItems);
    } else {
      setDraggedItems([item]);
    }
  };
  const handleDragEnd = () => {
    setDraggedItems([]);
  };

  // Đổi tên (call backend and update state)
  const handleRename = async (id, type, newName) => {
    try {
      const res = await axiosClient.post("/api/upload/rename", {
        id,
        type,
        newName,
      });
      const data = res.data;
      if (!data.success) throw new Error(data.error || "Rename failed");
      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
      );
      toast.success(t("hooks.home_table.rename_success"));
    } catch (e) {
      toast.error(t("hooks.home_table.rename_failed", { message: e.message }));
    }
  };

  // Lọc dữ liệu (ví dụ: theo search/filterType)
  const filterData = (filterType, searchTerm) => {
    return data.filter((item) => {
      if (filterType === "folder" && item.type !== "folder") return false;
      if (
        filterType === "image" &&
        !/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(item.name)
      )
        return false;
      if (
        filterType === "video" &&
        !/\.(mp4|avi|mov|wmv|flv|mkv)$/i.test(item.name)
      )
        return false;
      if (filterType === "word" && !/\.(doc|docx)$/i.test(item.name))
        return false;
      if (
        searchTerm &&
        !item.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    });
  };

  return {
    selectedItems,
    setSelectedItems,
    draggedItems,
    setDraggedItems,
    handleSelectItem,
    handleSelectAll,
    handleDragStart,
    handleDragEnd,
    handleRename,
    filterData,
  };
}
