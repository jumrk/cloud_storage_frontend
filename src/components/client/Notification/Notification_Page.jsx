import React from "react";
import {
  FiBell,
  FiCheckCircle,
  FiAlertCircle,
  FiMoreHorizontal,
} from "react-icons/fi";

const notifications = [
  {
    id: 1,
    title: "Tệp mới được chia sẻ với bạn",
    content: "Nguyễn Văn A vừa chia sẻ tệp 'Báo cáo doanh thu Q2.pdf' cho bạn.",
    time: "2 phút trước",
    read: false,
    icon: <FiBell className="text-primary text-lg" />,
  },
  {
    id: 2,
    title: "Đổi mật khẩu thành công",
    content: "Bạn đã đổi mật khẩu tài khoản thành công.",
    time: "1 giờ trước",
    read: true,
    icon: <FiCheckCircle className="text-green-500 text-lg" />,
  },
  {
    id: 3,
    title: "Cảnh báo đăng nhập lạ",
    content: "Có một đăng nhập bất thường từ thiết bị mới tại Hà Nội.",
    time: "Hôm qua",
    read: false,
    icon: <FiAlertCircle className="text-yellow-500 text-lg" />,
  },
  {
    id: 4,
    title: "Tệp đã bị xóa",
    content: "Tệp 'Hợp đồng 2023.docx' đã bị xóa khỏi hệ thống.",
    time: "2 ngày trước",
    read: true,
    icon: <FiBell className="text-primary text-lg" />,
  },
];

function Notification_Page() {
  return (
    <div className="w-full max-w-3xl mx-auto bg-white p-8 mt-8 border border-gray-100">
      {/* Tiêu đề & mô tả */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Thông báo</h1>
        <p className="text-gray-500 text-sm">
          Xem các thông báo mới nhất của bạn tại đây.
        </p>
      </div>
      {/* Danh sách thông báo */}
      <div className="divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-gray-400">
            <FiBell className="text-4xl mb-2" />
            Không có thông báo nào.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-4 py-5 px-2 transition bg-white ${
                !item.read ? "bg-blue-50/60" : ""
              } hover:bg-blue-50/80`}
            >
              <div className="mt-1">{item.icon}</div>
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold text-base ${
                      !item.read ? "text-primary" : "text-gray-900"
                    }`}
                  >
                    {item.title}
                  </span>
                  {!item.read && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-white text-xs font-semibold">
                      Mới
                    </span>
                  )}
                </div>
                <div className="text-gray-600 text-sm mt-0.5">
                  {item.content}
                </div>
                <div className="text-gray-400 text-xs mt-1">{item.time}</div>
              </div>
              <button className="ml-2 text-gray-400 hover:text-gray-700 p-2 rounded-full self-start">
                <FiMoreHorizontal className="text-lg" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notification_Page;
