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
      className="fixed bottom-3 right-3 z-[99999] px-3 py-2 text-xs bg-[#c0392b] text-white border-0 rounded-md cursor-pointer"
      title="Sentry verify"
    >
      Break the world
    </button>
  );
}
