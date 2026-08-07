import React from 'react';
import { Monitor, ChevronDown, ChevronRight } from 'lucide-react';
import CopyButton from './CopyButton';

export default function SettingsBotsOverlaysPanel({
  t,
  streamMode,
  apiKey,
  legacyFallback,
  overlayKeyLoading,
  overlayKeyGenerating,
  onGenerateOverlayKey,
  overlaySectionOpen,
  setOverlaySectionOpen,
  overlayItems,
  getOverlayUrl,
  copiedMessage,
}) {
  return (
    <div id="bots-overlays" className="rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/80 to-white dark:from-gray-800/80 dark:to-gray-800/50 p-5 sm:p-6 scroll-mt-4">
      <button
        type="button"
        onClick={() => setOverlaySectionOpen((o) => !o)}
        className="flex w-full items-center gap-2 text-left"
      >
        <Monitor className="w-5 h-5 text-indigo-500 flex-shrink-0" />
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
          {t('bots.overlaysTitle') || 'Overlays for OBS / Streamlabs'}
        </h4>
        {overlaySectionOpen ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
      </button>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        {t('bots.overlaysIntro') || 'Show next stream, goal, weekly schedule or quotes on your stream. Add as Browser Source in OBS.'}
      </p>
      {overlaySectionOpen && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onGenerateOverlayKey}
              disabled={overlayKeyLoading || overlayKeyGenerating || streamMode}
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {overlayKeyGenerating
                ? (t('common.loading') || '...')
                : apiKey && !legacyFallback
                  ? (t('bots.regenerateOverlayKey') || 'Regenerate overlay key')
                  : (t('bots.generateOverlayKey') || 'Generate overlay key')}
            </button>
            {legacyFallback && (
              <span className="text-xs text-amber-700 dark:text-amber-300">
                {t('bots.overlayUsingLegacyNightbotKey') ||
                  'Using Nightbot key for overlays (legacy). Generate an overlay key so OBS URLs cannot run bot commands.'}
              </span>
            )}
          </div>
          <div className="mt-4 p-4 rounded-lg bg-white dark:bg-gray-800/70 border border-indigo-100 dark:border-indigo-900/50">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{t('bots.overlaysStepsTitle') || 'How to add in OBS'}</p>
            <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside">
              <li>{t('bots.overlaysStep1') || 'In OBS: Sources → Add → Browser Source'}</li>
              <li>{t('bots.overlaysStep2') || 'Paste one of the URLs below (it already includes your API key)'}</li>
              <li>{t('bots.overlaysStep3') || 'Set width and height (e.g. 500 × 200). Optional: check "Shutdown source when not visible" to save resources.'}</li>
            </ol>
          </div>
          <div className="mt-4 space-y-3">
            {overlayItems.map(({ id, path, label, size }) => {
              const url = getOverlayUrl(path);
              return (
                <div key={id} className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-3 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{label}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{size}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {url ? (
                      <>
                        <code className="flex-1 min-w-0 text-xs break-all bg-gray-100 dark:bg-gray-700 px-2 py-1.5 rounded">{url}</code>
                        <CopyButton text={url} label={t('bots.copyObsUrl') || 'Copy OBS URL'} copiedMessage={copiedMessage} />
                      </>
                    ) : streamMode && apiKey ? (
                      <span className="text-gray-500 dark:text-gray-400 text-xs">{t('common.streamModeHidden') || 'Hidden (stream mode is on)'}</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 text-xs">{t('bots.generateOverlayKeyFirst') || 'Generate an overlay key above first.'}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {t('bots.overlaysHint') || 'Each overlay refreshes automatically. They show "Powered by StreamAutomator" so viewers can find the app.'}
          </p>
        </>
      )}
    </div>
  );
}
