import { jwtVerify } from "jose";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
export async function getTokenUserId(req) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/token=([^;]+)/);
  if (!match) throw new Error("Chưa đăng nhập");

  const userData = verifyToken(match[1]);
  if (!userData || !userData.id) throw new Error("Token không hợp lệ");

  return userData.id;
}

export async function decodeTokenGetUser(token) {
  try {
    // Kiểm tra token có tồn tại và hợp lệ không
    if (!token || typeof token !== "string") {
      console.log("Token is null, undefined, or not a string:", token);
      return null;
    }

    // Kiểm tra format JWT (phải có 3 phần)
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.log("Invalid JWT format - expected 3 parts, got:", parts.length);
      return null;
    }

    // Sử dụng cùng cách decode với backend
    // JWT: header.payload.signature
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded || null;
  } catch (err) {
    console.error("Decode JWT error:", err);
    return null;
  }
}
