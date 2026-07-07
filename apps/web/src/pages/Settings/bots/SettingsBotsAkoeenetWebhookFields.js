import React from 'react';
import { DEFAULT_AKOENET_WEBHOOK_URL, MASK } from './constants';

export default function SettingsBotsAkoeenetWebhookFields({
  t,
  streamMode,
  user,
  akoenetUrl,
  setAkoenetUrl,
  akoenetSecret,
  setAkoenetSecret,
  idPrefix = '',
}) {
  const urlId = `${idPrefix}akoenetWebhookUrl`;
  const secretId = `${idPrefix}akoenetWebhookSecret`;

  return (
    <>
      <div>
        <label htmlFor={urlId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('bots.akoenetWebhookUrl') || 'Webhook URL'}
        </label>
        <input
          id={urlId}
          type="url"
          autoComplete="off"
          value={streamMode && akoenetUrl ? MASK : akoenetUrl}
          onChange={(e) => !streamMode && setAkoenetUrl(e.target.value)}
          readOnly={streamMode}
          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          placeholder={DEFAULT_AKOENET_WEBHOOK_URL}
        />
      </div>
      <div>
        <label htmlFor={secretId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('bots.akoenetSecret') || 'Shared secret'}
        </label>
        <input
          id={secretId}
          type="password"
          autoComplete="new-password"
          value={streamMode ? '' : akoenetSecret}
          onChange={(e) => !streamMode && setAkoenetSecret(e.target.value)}
          readOnly={streamMode}
          className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          placeholder={
            user?.akoenetWebhookSecretSet
              ? (t('bots.akoenetSecretPlaceholder') || 'Leave blank to keep current secret')
              : (t('bots.akoenetSecretPlaceholderNew') || 'Same shared password as on your AkoeNet server')
          }
        />
        {user?.akoenetWebhookSecretSet && !streamMode && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('bots.akoenetSecretStored') || 'A secret is already saved. Enter a new one to replace it, or clear it below.'}
          </p>
        )}
      </div>
    </>
  );
}
