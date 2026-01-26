import React, { useState, useMemo } from "react";
import { FiX, FiPlus, FiTag, FiTrash2, FiEdit2, FiCheck, FiCircle } from "react-icons/fi";
import { useTranslations } from "next-intl";
import FileManagementService from "../services/fileManagementService";
import toast from "react-hot-toast";

const COLORS = [
  "#2196F3", "#4CAF50", "#F44336", "#FFEB3B", "#9C27B0", "#FF9800", "#795548", "#607D8B",
  "#E91E63", "#00BCD4", "#009688", "#CDDC39", "#3F51B5", "#673AB7", "#FF5722", "#000000"
];

const TagManagementModal = ({ isOpen, onClose, tags, onRefresh }) => {
  const t = useTranslations();
  const api = useMemo(() => FileManagementService(), []);
  // ✅ No need for token - cookie sent automatically

  const [loading, setLoading] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [newTag, setNewTag] = useState({ name: "", color: COLORS[0] });

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!newTag.name.trim()) return;
    setLoading(true);
    try {
      const res = await api.createTag(newTag);
      if (res.success) {
        toast.success("Đã tạo nhãn mới");
        setNewTag({ name: "", color: COLORS[0] });
        onRefresh();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Lỗi tạo nhãn");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTag || !editingTag.name.trim()) return;
    setLoading(true);
    try {
      const res = await api.updateTag(editingTag._id, editingTag);
      if (res.success) {
        toast.success("Đã cập nhật nhãn");
        setEditingTag(null);
        onRefresh();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Lỗi cập nhật nhãn");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tagId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhãn này? Nó sẽ bị gỡ khỏi tất cả các tệp.")) return;
    setLoading(true);
    try {
      const res = await api.deleteTag(tagId);
      if (res.success) {
        toast.success("Đã xóa nhãn");
        onRefresh();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Lỗi xóa nhãn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 text-gray-900 font-bold text-lg">
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <FiTag size={20} />
            </div>
            {t("file.modal.manage_tags_title") || "Quản lý nhãn"}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 main-content-scrollbar">
          {/* Create New Tag */}
          <div className="bg-brand/5 border border-brand/10 rounded-2xl p-4 space-y-4">
            <h4 className="text-sm font-bold text-brand uppercase tracking-wider flex items-center gap-2">
              <FiPlus size={14} /> {t("file.modal.create_tag") || "Tạo nhãn mới"}
            </h4>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder={t("file.modal.tag_name_placeholder") || "Tên nhãn..."}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all text-sm"
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              />
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTag({ ...newTag, color })}
                    className={`w-6 h-6 rounded-full transition-transform hover:scale-125 ${
                      newTag.color === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                onClick={handleCreate}
                disabled={loading || !newTag.name.trim()}
                className="w-full py-2.5 bg-brand text-white rounded-xl font-bold text-sm shadow-md shadow-brand/20 hover:opacity-90 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <FiPlus size={16} /> {t("file.button.create") || "Tạo mới"}
              </button>
            </div>
          </div>

          {/* Tag List */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              {t("file.modal.existing_tags") || "Danh sách nhãn"} ({tags.length})
            </h4>
            {tags.length === 0 ? (
              <div className="text-center py-8 text-gray-400 italic text-sm">
                Chưa có nhãn nào được tạo
              </div>
            ) : (
              <div className="space-y-2">
                {tags.map((tag) => (
                  <div
                    key={tag._id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand/20 hover:bg-gray-50 transition-all group"
                  >
                    {editingTag?._id === tag._id ? (
                      <div className="flex-1 flex flex-col gap-2">
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-brand outline-none"
                          value={editingTag.name}
                          onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                          autoFocus
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => setEditingTag({ ...editingTag, color })}
                              className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${
                                editingTag.color === color ? "ring-2 ring-offset-1 ring-gray-400" : ""
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={handleUpdate}
                            className="flex-1 py-1.5 bg-brand text-white rounded-lg text-xs font-bold"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingTag(null)}
                            className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {tag.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {tag.filesCount || 0} tệp tin
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingTag(tag)}
                            className="p-2 text-gray-400 hover:text-brand hover:bg-white rounded-lg transition-all shadow-sm"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          {!tag.isSystem && (
                            <button
                              onClick={() => handleDelete(tag._id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-all shadow-sm"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagManagementModal;
