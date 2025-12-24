import axiosClient from "@/shared/lib/axiosClient";

/**
 * Shared services for video tools
 * Common utilities that can be used across different tools
 */
export const sharedService = {
  /**
   * Get project by ID
   * @param {string} projectId
   * @returns {Promise<Object>} - Project data
   */
  async getProject(projectId) {
    const response = await axiosClient.get(
      `/api/video-processor/project/${projectId}`
    );
    return response.data;
  },

  /**
   * List user's projects
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Projects list
   */
  async listProjects(params = {}) {
    const response = await axiosClient.get("/api/video-processor/projects", {
      params,
    });
    return response.data;
  },

  /**
   * Get project assets
   * @param {string} projectId
   * @returns {Promise<Object>} - Assets list
   */
  async getProjectAssets(projectId) {
    const response = await axiosClient.get(
      `/api/video-processor/project/${projectId}/assets`
    );
    return response.data;
  },
};

