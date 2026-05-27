/**
 * StreamAutomator — frontend · Dakinis Systems
 * Copyright © 2024-2026 Dakinis Systems. All rights reserved.
 * Proprietary Software - Unauthorized copying, distribution, or modification is strictly prohibited.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { saInitSentryBrowser, Sentry } from './lib/sentry.js';
import DevSentryErrorButton from './components/DevSentryErrorButton.js';
import { dakinisCopyrightNotice } from './constants/copyright';

if (typeof document !== 'undefined') {
  const meta = document.querySelector('meta[name="copyright"]');
  const notice = dakinisCopyrightNotice();
  if (meta) meta.setAttribute('content', notice);
}

// Rewrite any fetch to Supabase base URL (no path) to /auth/v1/settings so SDK doesn't get 404
const supabaseBase = (process.env.REACT_APP_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_AUTH_SETTINGS_PATH = '/auth/v1/settings';
if (supabaseBase && typeof window !== 'undefined' && window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    let reqUrl = typeof input === 'string' ? input : (input && input.url);
    if (reqUrl) {
      const u = String(reqUrl).replace(/\/$/, '').split('?')[0];
      if (u === supabaseBase) {
        const newUrl = supabaseBase + SUPABASE_AUTH_SETTINGS_PATH;
        input = typeof input === 'string' ? newUrl : new Request(newUrl, input);
      }
    }
    return originalFetch.call(this, input, init);
  };
}

saInitSentryBrowser();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <div style={{ padding: '2rem', fontFamily: 'system-ui,sans-serif' }}>
          <h1>Error inesperado</h1>
          <p>Recarga la página.</p>
        </div>
      }
    >
      <App />
      <DevSentryErrorButton />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
); 
