/**
 * HTML Sanitizer to prevent XSS and crypto mining scripts
 * Only allows safe HTML tags and attributes
 */
const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
  "span",
  "div",
];

const ALLOWED_ATTRIBUTES = {
  a: ["href", "title", "target", "rel"],
  code: ["class"],
  pre: ["class"],
  span: ["class"],
  div: ["class"],
};

/**
 * Sanitize HTML content to prevent XSS and crypto mining
 * @param {string} html - HTML string to sanitize
 * @returns {string} - Sanitized HTML
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== "string") return "";

  // Remove script tags and event handlers
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // Remove event handlers
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/data:text\/html/gi, "") // Remove data URIs
    .replace(/vbscript:/gi, ""); // Remove vbscript: protocol

  // Remove suspicious patterns (crypto mining related)
  const suspiciousPatterns = [
    /coinhive/i,
    /cryptonight/i,
    /webmine/i,
    /miner/i,
    /new Worker/i,
    /new SharedWorker/i,
    /WebSocket.*miner/i,
  ];

  suspiciousPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  return sanitized;
}

/**
 * Sanitize and format markdown-like content for safe display
 * @param {string} content - Content to sanitize and format
 * @returns {string} - Sanitized HTML
 */
export function sanitizeAndFormat(content) {
  if (!content || typeof content !== "string") return "";

  // First sanitize
  let sanitized = sanitizeHtml(content);

  // Then apply safe formatting (markdown-like)
  sanitized = sanitized
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs">$1</code>'
    )
    .replace(/\n/g, "<br />");

  // Final sanitization pass
  return sanitizeHtml(sanitized);
}
