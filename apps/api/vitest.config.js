/**
 * Vitest Configuration
 * Test runner configuration
 * Copyright © 2024-2026 Dakinis Systems. All rights reserved.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: [
      'node_modules/**',
      'packages/**/node_modules/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'migrations/',
        '**/*.config.js',
      ],
    },
  },
});
