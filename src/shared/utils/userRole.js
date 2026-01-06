/**
 * User Role Utilities
 * Helper functions to check user roles and permissions
 */

/**
 * Get user role from user object
 * @param {Object} user - User object
 * @returns {string|null} - "leader" | "member" | null
 */
export function getUserRole(user) {
  if (!user) return null;
  return user.role || null;
}

/**
 * Check if user is a leader
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isLeader(user) {
  return getUserRole(user) === "leader";
}

/**
 * Check if user is a member
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isMember(user) {
  return getUserRole(user) === "member";
}

/**
 * Check if user has a specific permission
 * @param {Object} user - User object
 * @param {string} permission - Permission name
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
  if (!user) return false;
  
  // Leader has all permissions
  if (isLeader(user)) return true;
  
  // Member permissions check
  if (isMember(user)) {
    const memberPermissions = {
      "file.upload": true,
      "file.download": true,
      "file.delete": true,
      "file.move": true,
      "file.rename": true,
      "folder.create": true,
      "job.management": true,
      "video.tools": true,
      "chat": true,
      "settings": true,
      // Member cannot:
      "file.grant_permission": false,
      "dashboard.access": false,
    };
    
    return memberPermissions[permission] || false;
  }
  
  return false;
}

/**
 * Check if user can access a specific route
 * @param {Object} user - User object
 * @param {string} route - Route path (e.g., "/home", "/file-management")
 * @returns {boolean}
 */
export function canAccessRoute(user, route) {
  if (!user) return false;
  
  // Leader can access all routes
  if (isLeader(user)) return true;
  
  // Member restrictions
  if (isMember(user)) {
    // Member cannot access dashboard/home
    if (route === "/home" || route.includes("/home")) {
      return false;
    }
    
    // Member can access all other routes
    return true;
  }
  
  return false;
}

