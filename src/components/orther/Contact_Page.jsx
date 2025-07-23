"use client";
import React, { useState } from "react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import axiosClient from "@/lib/axiosClient";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    if (!form.name || !form.email || !form.message) {
      setAlert({ type: "error", msg: "Vui lòng nhập đầy đủ thông tin." });
      return;
    }
    setLoading(true);
    try {
      const res = await axiosClient.post("/api/support/contact", form);
      const data = res.data;
      setAlert({
        type: "success",
        msg: data.message || "Gửi yêu cầu thành công!",
      });
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      const msg = err?.response?.data?.error || "Gửi yêu cầu thất bại.";
      setAlert({ type: "error", msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f7f8fa] pb-16">
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-8">
        <ScrollReveal>
          <h1 className="text-4xl md:text-5xl font-bold text-[#189ff2] mb-4 text-center">
            Liên hệ & Hỗ trợ
          </h1>
          <p className="text-gray-700 text-lg mb-8 text-center">
            Nếu bạn cần hỗ trợ, tư vấn hoặc có bất kỳ thắc mắc nào về D2MBox,
            hãy liên hệ với chúng tôi qua các kênh dưới đây hoặc gửi yêu cầu
            trực tiếp bằng form.
          </p>
        </ScrollReveal>
        <ScrollReveal>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Thông tin liên hệ */}
            <div className="bg-white rounded-2xl shadow-lg p-8 flex-1 mb-8 md:mb-0 flex flex-col justify-center">
              <h2 className="text-2xl font-bold mb-6 text-[#189ff2] flex items-center gap-2">
                <GlobeAltIcon className="w-7 h-7 text-[#189ff2]" /> Thông tin
                liên hệ
              </h2>
              <ul className="text-gray-700 text-base space-y-5">
                <li className="flex items-start gap-3">
                  <MapPinIcon className="w-6 h-6 text-[#189ff2] mt-1" />
                  <div>
                    <span className="font-semibold">Địa chỉ:</span> 205 Bình Đức
                    5, Phường Bình Đức, An Giang
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <EnvelopeIcon className="w-6 h-6 text-[#189ff2] mt-1" />
                  <div>
                    <span className="font-semibold">Email:</span>{" "}
                    contact-d2m@dammeviet.vn
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <PhoneIcon className="w-6 h-6 text-[#189ff2] mt-1" />
                  <div>
                    <span className="font-semibold">Điện thoại:</span> +84 911
                    930 807
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <GlobeAltIcon className="w-6 h-6 text-[#189ff2] mt-1" />
                  <div>
                    <span className="font-semibold">Fanpage:</span>{" "}
                    <a
                      href="https://facebook.com/dichthuatdammeviet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#189ff2] underline"
                    >
                      facebook.com/dichthuatdammeviet
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-[#189ff2] mt-1" />
                  <div>
                    <span className="font-semibold">Whatsapp/Wechat:</span> +84
                    911 930 807
                  </div>
                </li>
              </ul>
            </div>
            {/* Form liên hệ */}
            <div className="bg-white rounded-2xl shadow-lg p-8 flex-1">
              <h2 className="text-2xl font-bold mb-6 text-[#189ff2] flex items-center gap-2">
                <EnvelopeIcon className="w-7 h-7 text-[#189ff2]" /> Gửi yêu cầu
                hỗ trợ
              </h2>
              {alert && (
                <div
                  className={`mb-4 px-4 py-3 rounded text-base font-medium ${
                    alert.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {alert.msg}
                </div>
              )}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block font-medium mb-1">Họ và tên</label>
                  <input
                    name="name"
                    type="text"
                    className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-[#189ff2]"
                    placeholder="Nhập họ tên của bạn"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-[#189ff2]"
                    placeholder="Nhập email liên hệ"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    Nội dung hỗ trợ
                  </label>
                  <textarea
                    name="message"
                    className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-[#189ff2]"
                    rows={5}
                    placeholder="Mô tả vấn đề bạn cần hỗ trợ..."
                    value={form.message}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#189ff2] text-white font-bold px-8 py-3 rounded-lg shadow hover:bg-[#0d8ad1] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Đang gửi..." : "Gửi yêu cầu"}
                </button>
              </form>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
