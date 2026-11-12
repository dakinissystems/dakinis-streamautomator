/**
 * HTML sanitization utilities
 * Prevents XSS attacks by cleaning user input
 * Copyright © 2024-2026 Dakinis Systems. All rights reserved.
 */

/**
 * Simple HTML sanitizer (lightweight alternative to DOMPurify)
 * Removes potentially dangerous HTML tags and attributes
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html) {
  return escapeHtml(html);
}

/**
 * Sanitize plain text (remove HTML entirely)
 * @param {string} text - Text to sanitize
 * @returns {string} Plain text without HTML
 */
export function sanitizeText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return escapeHtml(text).trim();
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
export function escapeHtml(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (m) => map[m]);
}
