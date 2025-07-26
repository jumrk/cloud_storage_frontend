"use client";
import React, { useEffect, useState, useCallback } from "react";
import useSocket from "@/lib/useSocket";
import axiosClient from "@/lib/axiosClient";
import { useTranslations } from "next-intl";

export default function LeaderChatPage() {
  const t = useTranslations();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [to, setTo] = useState(""); // adminId sẽ lấy từ backend
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  // Lấy adminId từ backend (giả sử chỉ có 1 admin)
  useEffect(() => {
    async function fetchAdmin() {
      try {
        const res = await axiosClient.get("/api/user/admin");
        if (res.data && res.data.admin && res.data.admin._id) {
          setTo(res.data.admin._id);
        }
      } catch {}
    }
    fetchAdmin();
  }, []);

  // Lấy lịch sử chat khi vào trang
  useEffect(() => {
    if (!to || !token) return;
    async function fetchHistory() {
      try {
        const res = await axiosClient.get(`/api/message?withUser=${to}`);
        if (res.data && res.data.messages) {
          setMessages(res.data.messages);
        }
      } catch {}
    }
    fetchHistory();
  }, [to, token]);

  // Kết nối socket
  const onMessage = useCallback(
    (msg) => setMessages((prev) => [...prev, msg]),
    []
  );
  const socketRef = useSocket(token, onMessage);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !to) return;
    if (socketRef.current) {
      socketRef.current.emit("chat:send", { to, content: input });
    }
    setInput("");
  };

  return (
    <div className="max-w-xl mx-auto p-4 flex flex-col h-[80vh]">
      <h2 className="text-xl font-bold mb-4">{t("chat.leader.title")}</h2>
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-3 mb-3">
        {messages.map((msg, idx) => (
          <div
            key={msg._id || idx}
            className={`mb-2 flex ${
              msg.from === to ? "justify-start" : "justify-end"
            }`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-[70%] text-sm shadow ${
                msg.from === to
                  ? "bg-gray-200 text-gray-800"
                  : "bg-blue-500 text-white"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder={t("chat.leader.input_placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {t("chat.leader.send")}
        </button>
      </form>
    </div>
  );
}
