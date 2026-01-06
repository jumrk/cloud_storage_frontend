import axiosClient from "@/shared/lib/axiosClient";

export const extractSubtitleService = {
  /**
   * Start subtitle extraction job
   * @param {File} videoFile - Video file to process
   * @param {string} lang - Language code (default: "auto")
   * @returns {Promise<Object>} - { success: true, jobId }
   */
  async startExtraction(videoFile, lang = "auto") {
    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("lang", lang);

    const response = await axiosClient.post(
      "/api/tools/extract-subtitle/start",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Get extraction job status
   * @param {string} jobId
   * @returns {Promise<Object>} - Job status with subtitles
   */
  async getStatus(jobId) {
    const response = await axiosClient.get(
      `/api/tools/extract-subtitle/status/${jobId}`
    );
    return response.data;
  },

  /**
   * Download subtitle file
   * @param {string} jobId
   * @param {string} format - "srt" or "vtt"
   * @returns {Promise<Blob>} - File blob
   */
  async downloadSubtitle(jobId, format = "srt") {
    const response = await axiosClient.get(
      `/api/tools/extract-subtitle/download/${jobId}?format=${format}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  },

  /**
   * Get history of completed jobs
   * @returns {Promise<Object>} - { success: true, jobs: [...] }
   */
  async getHistory() {
    const response = await axiosClient.get("/api/tools/extract-subtitle/history");
    return response.data;
  },
};
