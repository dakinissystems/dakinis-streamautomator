import React from 'react';

function sentryDsn() {
  return String(
    import.meta.env.VITE_SENTRY_DSN ||
      process.env.REACT_APP_SENTRY_DSN ||
      ''
  ).trim();
}

export default function DevSentryErrorButton() {
  const show =
    import.meta.env.DEV ||
    String(
      import.meta.env.VITE_SENTRY_TEST_BUTTON ||
        process.env.REACT_APP_SENTRY_TEST_BUTTON ||
        ''
    ).toLowerCase() === 'true';

  if (!show) return null;
  if (!sentryDsn()) return null;

  return (
    <button
      type="button"
      onClick={() => {
        throw new Error('This is your first error!');
      }}
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        zIndex: 99999,
        padding: '8px 12px',
        fontSize: 12,
        background: '#c0392b',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
      }}
      title="Sentry verify"
    >
      Break the world
    </button>
  );
}
