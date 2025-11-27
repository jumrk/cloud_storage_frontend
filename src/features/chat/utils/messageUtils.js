export const ATTACHMENT_PREFIX = "__CHAT_ATTACHMENT__:";
export const SYSTEM_FILE_PREFIX = "__SYSTEM_FILE__:";
export const SYSTEM_MESSAGE_PREFIX = "__SYSTEM_MSG__:";
export const ATTACHMENT_TTL_MS = 1000 * 60 * 60 * 24 * 3; // 3 days

export function encodeAttachmentPayload(meta) {
  const payload = { ...meta };
  if (!payload.expiresAt) {
    payload.expiresAt = Date.now() + ATTACHMENT_TTL_MS;
  }
  return `${ATTACHMENT_PREFIX}${JSON.stringify(payload)}`;
}

// Encode system file payload (files from the file management system)
export function encodeSystemFilePayload(meta) {
  return `${SYSTEM_FILE_PREFIX}${JSON.stringify(meta)}`;
}

// Parse system file content
export function parseSystemFileContent(content) {
  if (!content || typeof content !== "string") return null;
  if (!content.startsWith(SYSTEM_FILE_PREFIX)) return null;
  try {
    return JSON.parse(content.slice(SYSTEM_FILE_PREFIX.length));
  } catch {
    return null;
  }
}

export function parseAttachmentContent(content) {
  if (!content || typeof content !== "string") return null;
  if (!content.startsWith(ATTACHMENT_PREFIX)) return null;
  try {
    return JSON.parse(content.slice(ATTACHMENT_PREFIX.length));
  } catch {
    return null;
  }
}

export function formatBytes(size = 0) {
  if (!size && size !== 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let idx = 0;
  let value = size;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${
    units[idx]
  }`;
}

// Parse system message content (group events like member added/removed)
export function parseSystemMessage(content) {
  if (!content || typeof content !== "string") return null;
  if (!content.startsWith(SYSTEM_MESSAGE_PREFIX)) return null;
  try {
    return JSON.parse(content.slice(SYSTEM_MESSAGE_PREFIX.length));
  } catch {
    return null;
  }
}

// Check if content is a system message
export function isSystemMessage(content) {
  return (
    content &&
    typeof content === "string" &&
    content.startsWith(SYSTEM_MESSAGE_PREFIX)
  );
}

// Format system message for display
export function formatSystemMessage(systemMsg) {
  if (!systemMsg) return null;

  switch (systemMsg.type) {
    case "members_added":
      return `${systemMsg.actorName} đã thêm ${systemMsg.memberNames} vào nhóm`;
    case "members_removed":
      return `${systemMsg.actorName} đã xóa ${systemMsg.memberNames} khỏi nhóm`;
    case "member_left":
      return `${systemMsg.memberName} đã rời khỏi nhóm`;
    case "group_created":
      return `${systemMsg.actorName} đã tạo nhóm`;
    case "group_renamed":
      return `${systemMsg.actorName} đã đổi tên nhóm thành "${systemMsg.newName}"`;
    case "avatar_changed":
      return `${systemMsg.actorName} đã thay đổi ảnh nhóm`;
    default:
      return "Có thay đổi trong nhóm";
  }
}
