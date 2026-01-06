/**
 * Check if user has access to video tools
 * Only jumrk03@gmail.com and dammevietdt@gmail.com have access
 */
export function hasVideoToolsAccess(user) {
  if (!user || !user.email) {
    return false;
  }

  const allowedEmails = [
    "jumrk03@gmail.com",
    "dammevietdt@gmail.com",
  ];

  return allowedEmails.includes(user.email.toLowerCase());
}

/**
 * Get video tools access message for users without access
 */
export function getVideoToolsAccessMessage() {
  return "Tính năng đang phát triển";
}

