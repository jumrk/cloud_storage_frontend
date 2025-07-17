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

export function decodeTokenGetUser(token) {
  try {
    // JWT: header.payload.signature
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded || null;
  } catch {
    return null;
  }
}
