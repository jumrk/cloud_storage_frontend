import React from "react";
import Modal from "./Modal";
import Button from "./button";
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  loading,
  title = "Xác nhận",
  message = "Bạn có chắc chắn?",
  confirmText = "Xác nhận",
  cancelText = "Hủy",
}) {
  if (!open) return null;
  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className="p-6 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg bg-white rounded-lg shadow-xl">
        <h2 className="text-lg font-bold mb-3 text-center text-gray-900">
          {title}
        </h2>
        <div className="text-center text-gray-600 mb-6">{message}</div>
        <div className="flex gap-2 justify-end">
          <Button
            handleClick={onClose}
            color="brand"
            variant="outline"
            children={cancelText}
          />
          <Button
            type="button"
            color="danger"
            handleClick={() => {
              if (onConfirm) {
                onConfirm();
              }
              if (onClose) {
                onClose();
              }
            }}
            children={confirmText}
            loading={loading}
          />
        </div>
      </div>
    </Modal>
  );
}
