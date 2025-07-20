"use client";
import React, { useEffect, useState, useCallback } from "react";
import useSocket from "@/lib/useSocket";
import axiosClient from "@/lib/axiosClient";

export default function AdminChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [to, setTo] = useState(""); // leaderId sẽ chọn từ danh sách
  const [leaders, setLeaders] = useState([]);
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";

  // Lấy danh sách leader
  useEffect(() => {
    async function fetchLeaders() {
      try {
        const res = await axiosClient.get("/api/user/leaders");
        if (res.data && res.data.leaders) {
          setLeaders(res.data.leaders);
          if (res.data.leaders.length > 0) setTo(res.data.leaders[0]._id);
        }
      } catch {}
    }
    fetchLeaders();
  }, []);

  // Lấy lịch sử chat khi chọn leader
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
      <h2 className="text-xl font-bold mb-4">Nhắn tin với leader</h2>
      <div className="mb-2">
        <label className="mr-2 font-semibold">Chọn leader:</label>
        <select
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border rounded px-2 py-1"
        >
          {leaders.map((l) => (
            <option key={l._id} value={l._id}>
              {l.fullName || l.email || l.username || l._id}
            </option>
          ))}
        </select>
      </div>
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
                  : "bg-green-500 text-white"
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
          placeholder="Nhập tin nhắn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Gửi
        </button>
      </form>
    </div>
  );
}
