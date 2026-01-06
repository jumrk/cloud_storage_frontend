import axiosClient from "@/shared/lib/axiosClient";

export const hardsubService = {
  /**
   * Start hardsub extraction job
   * @param {File} videoFile - Video file to process
   * @param {Object} region - Region coordinates { x, y, width, height }
   * @param {string} language - Language code (default: "vi")
   * @param {number} confidence - OCR confidence threshold (0-1)
   * @returns {Promise<Object>} - { success: true, jobId }
   */
  async startExtraction(videoFile, region, language = "vi", confidence = 0.8) {
    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("region", JSON.stringify(region));
    formData.append("language", language);
    formData.append("confidence", confidence.toString());

    const response = await axiosClient.post(
      "/api/tools/hardsub/start",
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
      `/api/tools/hardsub/status/${jobId}`
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
      `/api/tools/hardsub/download/${jobId}?format=${format}`,
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
    const response = await axiosClient.get("/api/tools/hardsub/history");
    return response.data;
  },
};
