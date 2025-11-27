import axiosClient from "@/shared/lib/axiosClient";

const FileManagementService = () => {
  const authHeaders = (token) =>
    token ? { Authorization: `Bearer ${token}` } : {};

  const getUploads = (
    { page = 1, limit = 20, parentId = null } = {},
    token,
    signal
  ) => {
    const params = { page, limit };
    if (parentId !== null && parentId !== undefined) params.parentId = parentId;
    return axiosClient
      .get("/api/upload", { params, signal, headers: authHeaders(token) })
      .then((r) => r.data);
  };

  const getMember = (token, signal) =>
    axiosClient
      .get("/api/user/members", { headers: authHeaders(token), signal })
      .then((r) => r.data);

  const createFolder = ({ name, parentId = null }, token, signal) =>
    axiosClient
      .post(
        "/api/upload/create_folder",
        { name, parentId },
        { headers: authHeaders(token), signal }
      )
      .then((r) => r.data);

  const getCurrentPermissions = (folderId, token, signal) =>
    axiosClient
      .get(`/api/folders/${folderId}/permissions`, {
        headers: authHeaders(token),
        signal,
      })
      .then((r) => r.data);

  const postPermission = (folderId, memberId, locked, token, signal) =>
    axiosClient
      .post(
        "/api/folders/permissions",
        { folderId, memberId, locked },
        {
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(token),
          },
          signal,
        }
      )
      .then((r) => r.data);

  const deletePermission = (folderId, memberId, token, signal) =>
    axiosClient
      .delete("/api/folders/permissions", {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token),
        },
        data: { folderId, memberId },
        signal,
      })
      .then((r) => r.data);

  const downloadInternal = (rawUrl, token, signal) => {
    const url = rawUrl?.startsWith("http")
      ? rawUrl
      : `${process.env.NEXT_PUBLIC_API_BASE || ""}${rawUrl}`;
    return axiosClient.get(url, {
      responseType: "blob",
      signal,
      headers: authHeaders(token),
    });
  };

  return {
    getUploads,
    getMember,
    createFolder,
    getCurrentPermissions,
    postPermission,
    deletePermission,
    downloadInternal,
  };
};

export default FileManagementService;
