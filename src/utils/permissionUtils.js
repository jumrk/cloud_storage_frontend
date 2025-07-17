import Folder from "../model/folderSchema.js";
import File from "../model/File.js";
import User from "../model/User.js";

/**
 * Kiểm tra quyền truy cập folder
 * @param {string} userId - ID của user cần kiểm tra
 * @param {string} folderId - ID của folder
 * @returns {Promise<boolean>}
 */
export async function checkFolderPermission(userId, folderId) {
  try {
    const folder = await Folder.findById(folderId);
    if (!folder || !folder.isActive) return false;
    // Owner luôn có quyền
    if (folder.user.toString() === userId) return true;
    // Kiểm tra quyền được cấp
    const permission = folder.permissions.find(
      (p) => p.memberId.toString() === userId
    );
    if (!permission) return false;
    // locked=false thì có quyền, locked=true thì không
    return !permission.locked;
  } catch (error) {
    console.error("Error checking folder permission:", error);
    return false;
  }
}

/**
 * Kiểm tra quyền truy cập file
 * @param {string} userId - ID của user cần kiểm tra
 * @param {string} fileId - ID của file
 * @param {string} requiredLevel - Mức quyền cần thiết ('read', 'write', 'admin')
 * @returns {Promise<boolean>}
 */
export async function checkFilePermission(
  userId,
  fileId,
  requiredLevel = "read"
) {
  try {
    const file = await File.findById(fileId);
    if (!file || !file.isActive) return false;

    // Owner luôn có quyền admin
    if (file.user.toString() === userId) return true;

    // Kiểm tra quyền được cấp trực tiếp
    const permission = file.permissions.find(
      (p) => p.memberId.toString() === userId
    );
    if (permission) {
      const levels = { read: 1, write: 2, admin: 3 };
      const userLevel = levels[permission.accessLevel] || 0;
      const requiredLevelNum = levels[requiredLevel] || 1;
      return userLevel >= requiredLevelNum;
    }

    // Kiểm tra quyền thông qua folder
    if (file.folderId) {
      return await checkFolderPermission(userId, file.folderId, requiredLevel);
    }

    return false;
  } catch (error) {
    console.error("Error checking file permission:", error);
    return false;
  }
}

/**
 * Cấp quyền cho member vào folder
 * @param {string} leaderId - ID của leader
 * @param {string} folderId - ID của folder
 * @param {string} memberId - ID của member
 * @param {boolean} locked - Trạng thái khóa quyền (true/false)
 * @returns {Promise<boolean>}
 */
export async function grantFolderPermission(
  leaderId,
  folderId,
  memberId,
  locked = false
) {
  try {
    // Kiểm tra leader là owner folder
    const folder = await Folder.findById(folderId);
    if (!folder || folder.user.toString() !== leaderId) return false;
    // Kiểm tra member có tồn tại và thuộc về leader không
    const member = await User.findById(memberId);
    if (!member || member.parent?.toString() !== leaderId) return false;
    // Cập nhật hoặc thêm permission
    const existingIndex = folder.permissions.findIndex(
      (p) => p.memberId.toString() === memberId
    );
    if (existingIndex >= 0) {
      folder.permissions[existingIndex].locked = locked;
      folder.permissions[existingIndex].grantedAt = new Date();
      folder.permissions[existingIndex].grantedBy = leaderId;
    } else {
      folder.permissions.push({
        memberId,
        locked,
        grantedAt: new Date(),
        grantedBy: leaderId,
      });
    }
    await folder.save();
    return true;
  } catch (error) {
    console.error("Error granting folder permission:", error);
    return false;
  }
}

/**
 * Cấp quyền cho file (tương tự folder)
 * @param {string} leaderId - ID của leader
 * @param {string} fileId - ID của file
 * @param {string} memberId - ID của member
 * @param {boolean} locked - Trạng thái khóa quyền (true/false)
 * @returns {Promise<boolean>}
 */
export async function grantFilePermission(
  leaderId,
  fileId,
  memberId,
  locked = false
) {
  try {
    // Kiểm tra leader là owner file
    const file = await File.findById(fileId);
    if (!file || file.user.toString() !== leaderId) return false;
    // Kiểm tra member có tồn tại và thuộc về leader không
    const member = await User.findById(memberId);
    if (!member || member.parent?.toString() !== leaderId) return false;
    // Cập nhật hoặc thêm permission
    const existingIndex = file.permissions.findIndex(
      (p) => p.memberId.toString() === memberId
    );
    if (existingIndex >= 0) {
      file.permissions[existingIndex].locked = locked;
      file.permissions[existingIndex].grantedAt = new Date();
      file.permissions[existingIndex].grantedBy = leaderId;
    } else {
      file.permissions.push({
        memberId,
        locked,
        grantedAt: new Date(),
        grantedBy: leaderId,
      });
    }
    await file.save();
    return true;
  } catch (error) {
    console.error("Error granting file permission:", error);
    return false;
  }
}

/**
 * Đệ quy cấp quyền cho folder và tất cả file/folder con bên trong
 * @param {string} leaderId - ID của leader
 * @param {string} folderId - ID của folder
 * @param {string} memberId - ID của member
 * @param {boolean} locked - Trạng thái khóa quyền (true/false)
 * @returns {Promise<boolean>}
 */
export async function grantFolderPermissionRecursive(
  leaderId,
  folderId,
  memberId,
  locked = false
) {
  // 1. Cấp quyền cho folder hiện tại
  await grantFolderPermission(leaderId, folderId, memberId, locked);
  // 2. Cấp quyền cho tất cả file trong folder này
  const files = await File.find({ folderId });
  for (const file of files) {
    await grantFilePermission(leaderId, file._id, memberId, locked);
  }
  // 3. Đệ quy cho tất cả folder con
  const subFolders = await Folder.find({ parentId: folderId });
  for (const sub of subFolders) {
    await grantFolderPermissionRecursive(leaderId, sub._id, memberId, locked);
  }
}

/**
 * Thu hồi quyền của member vào folder
 * @param {string} leaderId - ID của leader
 * @param {string} folderId - ID của folder
 * @param {string} memberId - ID của member
 * @returns {Promise<boolean>}
 */
export async function revokeFolderPermission(leaderId, folderId, memberId) {
  try {
    // Kiểm tra leader là owner folder
    const folder = await Folder.findById(folderId);
    if (!folder || folder.user.toString() !== leaderId) return false;
    folder.permissions = folder.permissions.filter(
      (p) => p.memberId.toString() !== memberId
    );
    await folder.save();
    return true;
  } catch (error) {
    console.error("Error revoking folder permission:", error);
    return false;
  }
}

/**
 * Lấy danh sách folder mà user có quyền truy cập
 * @param {string} userId - ID của user
 * @param {string} accessLevel - Mức quyền tối thiểu
 * @returns {Promise<Array>}
 */
export async function getUserAccessibleFolders(userId, accessLevel = "read") {
  try {
    const user = await User.findById(userId);
    if (!user) return [];

    let folders = [];

    if (user.role === "leader") {
      // Leader có thể truy cập tất cả folder của mình
      folders = await Folder.find({
        user: userId,
        isActive: true,
      });
    } else if (user.role === "member") {
      // Member chỉ có thể truy cập folder được cấp quyền
      folders = await Folder.find({
        "permissions.memberId": userId,
        isActive: true,
      });
    }

    return folders;
  } catch (error) {
    console.error("Error getting user accessible folders:", error);
    return [];
  }
}

/**
 * Lấy danh sách file mà user có quyền truy cập
 * @param {string} userId - ID của user
 * @param {string} accessLevel - Mức quyền tối thiểu
 * @returns {Promise<Array>}
 */
export async function getUserAccessibleFiles(userId, accessLevel = "read") {
  try {
    const user = await User.findById(userId);
    if (!user) return [];

    let files = [];

    if (user.role === "leader") {
      // Leader có thể truy cập tất cả file của mình
      files = await File.find({
        user: userId,
        isActive: true,
      });
    } else if (user.role === "member") {
      // Member chỉ có thể truy cập file được cấp quyền
      files = await File.find({
        "permissions.memberId": userId,
        isActive: true,
      });
    }

    return files;
  } catch (error) {
    console.error("Error getting user accessible files:", error);
    return [];
  }
}

/**
 * Kế thừa permission từ folder cha cho file/folder mới
 * @param {string} folderId - ID của folder cha
 * @param {string} itemId - ID của file/folder con
 * @param {string} itemType - 'file' hoặc 'folder'
 * @returns {Promise<boolean>}
 */
export async function inheritPermissionsFromParent(folderId, itemId, itemType) {
  try {
    const parentFolder = await Folder.findById(folderId);
    if (
      !parentFolder ||
      !parentFolder.permissions ||
      parentFolder.permissions.length === 0
    ) {
      return true; // Không có permission để kế thừa
    }

    if (itemType === "file") {
      const file = await File.findById(itemId);
      if (!file) return false;

      // Kế thừa tất cả permission từ folder cha
      file.permissions = [...parentFolder.permissions];
      await file.save();
    } else if (itemType === "folder") {
      const folder = await Folder.findById(itemId);
      if (!folder) return false;

      // Kế thừa tất cả permission từ folder cha
      folder.permissions = [...parentFolder.permissions];
      await folder.save();
    }

    return true;
  } catch (error) {
    console.error("Error inheriting permissions:", error);
    return false;
  }
}
