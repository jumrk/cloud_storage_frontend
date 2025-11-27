/**
 * Utility functions to parse subtitle files (SRT, VTT)
 */

function toSec(h, m, s, ms = 0) {
  return h * 3600 + m * 60 + s + ms / 1000;
}

function parseSRTTime(timeStr) {
  // Format: HH:MM:SS,mmm or HH:MM:SS.mmm
  const match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const s = parseInt(match[3], 10);
  const ms = parseInt(match[4], 10);
  return toSec(h, m, s, ms);
}

function parseVTTTime(timeStr) {
  // Format: HH:MM:SS.mmm or MM:SS.mmm
  const match = timeStr.match(/(\d{2}):(\d{2})(?::(\d{2}))?\.(\d{3})/);
  if (!match) return null;
  const hasHour = match[3] !== undefined;
  if (hasHour) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const s = parseInt(match[3], 10);
    const ms = parseInt(match[4], 10);
    return toSec(h, m, s, ms);
  } else {
    const m = parseInt(match[1], 10);
    const s = parseInt(match[2], 10);
    const ms = parseInt(match[4], 10);
    return toSec(0, m, s, ms);
  }
}

/**
 * Parse SRT subtitle file content
 * @param {string} text - SRT file content
 * @returns {Array<{start: number, end: number, text: string}>}
 */
export function parseSRT(text) {
  const blocks = text
    .replace(/\r/g, "")
    .trim()
    .split(/\n\s*\n/);
  
  const cues = [];
  
  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    if (lines.length < 2) continue;
    
    // Find the line with timing (contains -->)
    const timeIdx = lines.findIndex((l) => l.includes("-->"));
    if (timeIdx === -1) continue;
    
    const timeLine = lines[timeIdx];
    const match = /(.+?)\s*-->\s*(.+?)(?:\s|$)/.exec(timeLine);
    if (!match) continue;
    
    const start = parseSRTTime(match[1]);
    const end = parseSRTTime(match[2]);
    
    if (start === null || end === null || start >= end) continue;
    
    const textLines = lines.slice(timeIdx + 1);
    const content = textLines.join("\n").trim();
    
    if (content) {
      cues.push({ start, end, text: content });
    }
  }
  
  return cues;
}

/**
 * Parse VTT subtitle file content
 * @param {string} text - VTT file content
 * @returns {Array<{start: number, end: number, text: string}>}
 */
export function parseVTT(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  const cues = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Skip WEBVTT header and empty lines
    if (!line || /^WEBVTT/i.test(line)) {
      i++;
      continue;
    }
    
    // Skip cue number if present
    if (/^\d+$/.test(line)) {
      i++;
    }
    
    // Parse timing line
    const timingLine = lines[i]?.trim() || "";
    const match = /(.+?)\s*-->\s*(.+?)(?:\s|$)/.exec(timingLine);
    if (!match) {
      i++;
      continue;
    }
    
    const start = parseVTTTime(match[1]);
    const end = parseVTTTime(match[2]);
    
    if (start === null || end === null || start >= end) {
      i++;
      continue;
    }
    
    i++;
    
    // Collect text lines
    const buf = [];
    while (i < lines.length && lines[i].trim() !== "") {
      buf.push(lines[i]);
      i++;
    }
    
    const fullText = buf.join("\n").trim();
    
    // Remove timing tags from text for display
    const cleanText = fullText.replace(/<\d{2}:\d{2}(?::\d{2})?\.\d{3}>/g, "").trim();
    
    if (cleanText || fullText) {
      cues.push({
        start,
        end,
        text: cleanText || fullText,
      });
    }
    
    // Skip empty lines
    while (i < lines.length && lines[i].trim() === "") {
      i++;
    }
  }
  
  return cues;
}

/**
 * Parse subtitle file based on extension
 * @param {File} file - Subtitle file
 * @returns {Promise<Array<{start: number, end: number, text: string}>>}
 */
export async function parseSubtitleFile(file) {
  const text = await file.text();
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  
  if (ext === "srt") {
    return parseSRT(text);
  } else if (ext === "vtt") {
    return parseVTT(text);
  } else {
    // Default to SRT parsing
    return parseSRT(text);
  }
}

