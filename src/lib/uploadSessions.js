// Shared module để quản lý upload sessions
const uploadSessions = new Map();

export const getUploadSession = (uploadId) => {
  return uploadSessions.get(uploadId);
};

export const setUploadSession = (uploadId, session) => {
  uploadSessions.set(uploadId, session);
};

export const deleteUploadSession = (uploadId) => {
  uploadSessions.delete(uploadId);
};

export const getAllSessions = () => {
  return Array.from(uploadSessions.entries());
};

export const getSessionsByUserId = (userId) => {
  return Array.from(uploadSessions.entries())
    .filter(([_, session]) => session.userId === userId)
    .map(([uploadId, session]) => ({ uploadId, ...session }));
};

// Cleanup sessions older than 24 hours
export const cleanupExpiredSessions = () => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  for (const [uploadId, session] of uploadSessions.entries()) {
    if (session.createdAt < oneDayAgo) {
      uploadSessions.delete(uploadId);
    }
  }
};

// Auto cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
