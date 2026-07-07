import React from 'react';
import { Link2, AlertCircle } from 'lucide-react';
import { DEFAULT_AKOENET_WEBHOOK_URL } from './constants';
import SettingsBotsAkoeenetWebhookFields from './SettingsBotsAkoeenetWebhookFields';
import SettingsBotsAkoeenetServerChannelPicker from './SettingsBotsAkoeenetServerChannelPicker';

export default function SettingsBotsAkoeenetPanel({
  t,
  streamMode,
  user,
  akoenetUrl,
  setAkoenetUrl,
  akoenetSecret,
  setAkoenetSecret,
  akoenetChannelId,
  setAkoenetChannelId,
  akoenetSendClips,
  setAkoenetSendClips,
  akoenetSaving,
  akoenetServerId,
  setAkoenetServerId,
  akoenetConfigured,
  akoenetHostOnlyMode,
  akoenetPerUserConfigured,
  akoenetLegacyUrl,
  akoenetGuildsError,
  akoenetManualTargets,
  akoenetGuildsEmpty,
  hideAkoeNetWebhookFieldsInMain,
  akoenetPickerComplete,
  akoenetGuilds,
  akoenetChannels,
  loadingAkoenetGuilds,
  loadingAkoenetChannels,
  guildInList,
  handleSaveAkoeNet,
}) {
  return (
    <div id="bots-akoenet" className="rounded-xl border border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/90 to-white dark:from-violet-950/30 dark:to-gray-800/50 p-5 sm:p-6 scroll-mt-4">
      <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-medium mb-1 flex-wrap">
        <Link2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        {t('bots.akoenetTitle') || 'AkoeNet'}
        <span className="text-[10px] font-normal uppercase tracking-wide px-2 py-0.5 rounded bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200">
          {t('bots.akoenetCommunityBadge') || 'Community'}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-2xl">
        {streamMode
          ? (t('bots.akoenetStreamModeDescription') ||
              'AkoeNet settings are hidden while stream mode is on. Turn it off in the header to view or edit the webhook, secret, and channel.')
          : akoenetHostOnlyMode
            ? (t('bots.akoenetDescriptionHostConfigured') || 'The server already provides the AkoeNet webhook and secret. Pick your server and channel below (same idea as Discord).')
            : akoenetPerUserConfigured && akoenetPickerComplete
              ? (t('bots.akoenetDescriptionConnected') ||
                  'AkoeNet is linked. Announcements use the server and channel you select below.')
              : t('bots.akoenetDescription')}
      </p>
      {!streamMode && (
      <div className="space-y-4 max-w-xl">
        {akoenetLegacyUrl && (
          <div className="flex flex-col gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{t('bots.akoenetLegacyRenderUrl') || 'This webhook still points to the old Render host. Update it to the production AkoeNet API.'}</span>
            </div>
            <button
              type="button"
              className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium"
              onClick={() => setAkoenetUrl(DEFAULT_AKOENET_WEBHOOK_URL)}
            >
              {t('bots.akoenetUseProductionUrl') || 'Use production URL'}
            </button>
          </div>
        )}
        {!hideAkoeNetWebhookFieldsInMain && (
          <SettingsBotsAkoeenetWebhookFields
            t={t}
            streamMode={streamMode}
            user={user}
            akoenetUrl={akoenetUrl}
            setAkoenetUrl={setAkoenetUrl}
            akoenetSecret={akoenetSecret}
            setAkoenetSecret={setAkoenetSecret}
          />
        )}

        <SettingsBotsAkoeenetServerChannelPicker
          t={t}
          akoenetServerId={akoenetServerId}
          setAkoenetServerId={setAkoenetServerId}
          akoenetChannelId={akoenetChannelId}
          setAkoenetChannelId={setAkoenetChannelId}
          akoenetGuilds={akoenetGuilds}
          akoenetChannels={akoenetChannels}
          loadingAkoenetGuilds={loadingAkoenetGuilds}
          loadingAkoenetChannels={loadingAkoenetChannels}
          guildInList={guildInList}
          akoenetGuildsError={akoenetGuildsError}
          akoenetManualTargets={akoenetManualTargets}
          akoenetConfigured={akoenetConfigured}
          akoenetGuildsEmpty={akoenetGuildsEmpty}
          streamMode={streamMode}
        />

        <label className="flex items-start gap-3 cursor-pointer max-w-xl">
          <input
            type="checkbox"
            checked={akoenetSendClips}
            onChange={(e) => setAkoenetSendClips(e.target.checked)}
            disabled={streamMode}
            className="mt-1 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
          />
          <span>
            <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">{t('bots.akoenetSendClipsLabel')}</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('bots.akoenetSendClipsHint')}</span>
          </span>
        </label>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            disabled={akoenetSaving || streamMode}
            onClick={() => handleSaveAkoeNet(false)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {akoenetSaving ? (t('common.saving') || 'Saving…') : (t('bots.akoenetSave') || 'Save AkoeNet')}
          </button>
          {user?.akoenetWebhookSecretSet && !streamMode && !hideAkoeNetWebhookFieldsInMain && (
            <button
              type="button"
              disabled={akoenetSaving}
              onClick={() => {
                if (!window.confirm(t('bots.akoenetClearSecretConfirm') || 'Remove the stored webhook secret?')) return;
                handleSaveAkoeNet(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {t('bots.akoenetClearSecret') || 'Clear secret'}
            </button>
          )}
        </div>
        {hideAkoeNetWebhookFieldsInMain && !streamMode && akoenetHostOnlyMode && (
          <details className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 bg-white/60 dark:bg-gray-800/40">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('bots.akoenetAdvancedWebhook') || 'Advanced: custom webhook URL & secret (per user)'}
            </summary>
            <div className="mt-3 space-y-3">
              <SettingsBotsAkoeenetWebhookFields
                t={t}
                streamMode={streamMode}
                user={user}
                akoenetUrl={akoenetUrl}
                setAkoenetUrl={setAkoenetUrl}
                akoenetSecret={akoenetSecret}
                setAkoenetSecret={setAkoenetSecret}
                idPrefix="Advanced"
              />
              {user?.akoenetWebhookSecretSet && (
                <button
                  type="button"
                  disabled={akoenetSaving}
                  onClick={() => {
                    if (!window.confirm(t('bots.akoenetClearSecretConfirm') || 'Remove the stored webhook secret?')) return;
                    handleSaveAkoeNet(true);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  {t('bots.akoenetClearSecret') || 'Clear secret'}
                </button>
              )}
            </div>
          </details>
        )}
      </div>
      )}
    </div>
  );
}
