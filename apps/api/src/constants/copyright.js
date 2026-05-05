/**
 * Copyright strings for HTTP headers and API payloads.
 * Legal and commercial entity: Dakinis Systems.
 */

export const COPYRIGHT_BRAND_NAME = 'Dakinis Systems';
export const COPYRIGHT_LEGAL_HOLDER = 'Dakinis Systems';
export const COPYRIGHT_YEAR_START = 2024;

function currentCopyrightYearEnd() {
  return Math.max(COPYRIGHT_YEAR_START, new Date().getFullYear());
}

/** @type {{ year: number; text: string } | null} */
let noticeCache = null;

/**
 * Full English copyright line for X-Copyright, JSON, logs.
 * Cached per calendar year end (middleware calls this on every request).
 */
export function dakinisCopyrightNotice() {
  const end = currentCopyrightYearEnd();
  if (!noticeCache || noticeCache.year !== end) {
    noticeCache = {
      year: end,
      text: `Copyright © ${COPYRIGHT_YEAR_START}-${end} ${COPYRIGHT_LEGAL_HOLDER}. All rights reserved.`,
    };
  }
  return noticeCache.text;
}
