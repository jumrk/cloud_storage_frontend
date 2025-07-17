import React from "react";
import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Xác nhận",
  message = "Bạn có chắc chắn?",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
}) {
  if (!open) return null;
  return (
    <Modal onClose={onClose}>
      <div className="p-6 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
        <h2 className="text-lg font-bold mb-3 text-center text-gray-800">
          {title}
        </h2>
        <div className="text-center text-gray-600 mb-6">{message}</div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all font-medium"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-all font-medium"
            onClick={() => {
              onConfirm && onConfirm();
              onClose && onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
