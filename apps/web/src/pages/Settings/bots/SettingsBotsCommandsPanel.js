import React from 'react';
import { MessageSquare, ExternalLink } from 'lucide-react';
import CopyButton from './CopyButton';
import { API_BASE } from './constants';
import { getPublicStreamerShareUrl, getPublicEmbedStreamerShareUrl } from '../../../shared/config/publicUrls';

export default function SettingsBotsCommandsPanel({
  t,
  streamMode,
  user,
  apiKey,
  chatCommands,
  getChatUrl,
  getNightbotMsg,
  copyLabel,
  copiedMessage,
  scrollToId,
}) {
  return (
    <>
      <div id="bots-chat-commands" className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 p-5 sm:p-6 scroll-mt-4">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-indigo-500" />
          {t('bots.chatCommandsTitle') || 'Chat commands (GET — bot replies in chat)'}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {t('bots.chatCommandsDesc') || 'These endpoints return plain text. Your bot does a GET request and says the response in chat. Use ?key=YOUR_KEY.'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          {t('bots.streamerBotHint') || 'Streamer.bot: Action → HTTP Request → GET to the URL below. Nightbot: use $(urlfetch URL) in Custom Command.'}
        </p>

        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600 mb-6">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700/50">
                <th className="px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100">{t('bots.tableCommand') || 'Command'}</th>
                <th className="px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100">{t('bots.tableWhat') || 'What it does'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {chatCommands.map(({ cmd, desc, path }) => {
                const targetId = path ? `cmd-${path}` : undefined;
                return (
                  <tr
                    key={cmd}
                    className="bg-white dark:bg-gray-800/50 hover:bg-indigo-50/70 dark:hover:bg-indigo-900/40 cursor-pointer"
                    onClick={() => targetId && scrollToId(targetId)}
                  >
                    <td className="px-3 py-2 font-mono text-indigo-600 dark:text-indigo-400">{cmd}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{desc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">{t('bots.copyPasteReady') || 'Copy-paste ready (with your API key):'}</p>
        <div className="space-y-4">
          {chatCommands.map(({ cmd, path, pathAlt, desc, example }) => {
            const url = getChatUrl(path);
            const nightbotMsg = getNightbotMsg(path);
            const urlAlt = pathAlt ? getChatUrl(pathAlt) : null;
            return (
              <div
                key={path || cmd}
                id={path ? `cmd-${path}` : undefined}
                className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4"
              >
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <code className="font-mono font-medium text-indigo-600 dark:text-indigo-400">{cmd}</code>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">— {desc}</span>
                </div>
                {example && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 mt-1 italic">
                    {t('bots.exampleResponse') || 'Example'}: {example.split('\n')[0]}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {url ? (
                    <>
                      <code className="flex-1 min-w-0 text-xs break-all bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{url}</code>
                      <CopyButton text={url} label={copyLabel} copiedMessage={copiedMessage} />
                    </>
                  ) : streamMode && apiKey ? (
                    <span className="text-gray-500 dark:text-gray-400 text-xs">{t('common.streamModeHidden') || 'Hidden (stream mode is on)'}</span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 text-xs">{t('bots.generateKeyFirst') || 'Generate a key above first.'}</span>
                  )}
                </div>
                {!streamMode && url && nightbotMsg && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('bots.nightbotExample') || 'Nightbot — Message:'}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="flex-1 min-w-0 text-xs break-all bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">{nightbotMsg}</code>
                      <CopyButton text={nightbotMsg} label={copyLabel} copiedMessage={copiedMessage} />
                    </div>
                  </div>
                )}
                {urlAlt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {t('bots.scheduleAlsoAt') || 'Also works at'}: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">/api/webhooks/week</code>
                  </p>
                )}
                {path === 'quote/random' && !streamMode && apiKey && API_BASE && (
                  <details className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <summary className="text-xs font-medium text-amber-700 dark:text-amber-400 cursor-pointer">
                      {t('bots.quoteNightbotHint') || 'Nightbot: two commands (no JavaScript)'}
                    </summary>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-2">
                      {t('bots.quoteNightbotDesc') || 'Nightbot does not run JavaScript (so no $(eval) or encodeURIComponent). Create two separate commands using only $(urlfetch) and $(query):'}
                    </p>
                    <div className="space-y-2 text-xs">
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-0.5">1. !quote — random quote</p>
                        <code className="block break-all bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                          $(urlfetch {API_BASE}/api/webhooks/quote/random?key=YOUR_KEY)
                        </code>
                        <div className="mt-1 flex items-center gap-2">
                          <CopyButton text={`$(urlfetch ${API_BASE}/api/webhooks/quote/random?key=${apiKey})`} label={copyLabel} copiedMessage={copiedMessage} className="text-xs" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-0.5">2. !addquote — save quote (e.g. !addquote Hello there)</p>
                        <code className="block break-all bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                          $(urlfetch {API_BASE}/api/webhooks/quote/add?quote=$(query)&key=YOUR_KEY)
                        </code>
                        <div className="mt-1 flex items-center gap-2">
                          <CopyButton text={`$(urlfetch ${API_BASE}/api/webhooks/quote/add?quote=$(query)&key=${apiKey})`} label={copyLabel} copiedMessage={copiedMessage} className="text-xs" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 italic">
                          {t('bots.quoteNightbotSpaces') || 'If spaces break the URL, try !addquote with words separated by + or use a single word.'}
                        </p>
                      </div>
                    </div>
                  </details>
                )}
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                  <button
                    type="button"
                    onClick={() => scrollToId('bots-chat-commands')}
                    className="underline-offset-2 hover:underline"
                  >
                    {t('bots.backToList') || 'Back to list'}
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToId('bots-api-key')}
                    className="underline-offset-2 hover:underline"
                  >
                    {t('bots.backToTop') || 'Back to top'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {user?.username && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 p-5 sm:p-6">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{t('bots.viewerSuggestTitle') || '!suggest — Viewer suggestions'}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {t('bots.viewerSuggestDesc') || 'Viewers can suggest stream ideas. No API key needed. POST to this URL from your bot when someone types !suggest play Elden Ring.'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">POST — Body: {JSON.stringify({ text: 'play Elden Ring', suggestedBy: 'viewer_name' })}</p>
          <div className="flex flex-wrap items-center gap-2">
            {streamMode ? (
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('common.streamModeHidden') || 'Hidden (stream mode is on)'}</span>
            ) : (
              <>
                <code className="text-xs break-all text-gray-700 dark:text-gray-300">{API_BASE}/api/streamer/{encodeURIComponent(user.username)}/suggest</code>
                <CopyButton text={`${API_BASE}/api/streamer/${user.username}/suggest`} label={copyLabel} copiedMessage={copiedMessage} />
              </>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('bots.viewerSuggestDashboard') || 'Suggestions appear in the Suggestions page in the app.'}</p>
        </div>
      )}

      {user?.username && (
        <div id="bots-public-schedule" className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 p-5 sm:p-6 scroll-mt-4">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
            <ExternalLink className="w-4 h-4 text-indigo-500" />
            {t('bots.publicScheduleTitle') || 'Your public schedule'}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('bots.publicScheduleDesc') || 'Share this link in your Twitch bio, Discord or Twitter. Viewers see your upcoming streams and can get reminders.'}
          </p>
          <div className="space-y-3">
            {streamMode ? (
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('common.streamModeHidden') || 'Hidden (stream mode is on)'}</span>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={getPublicStreamerShareUrl(user.username)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                  >
                    {getPublicStreamerShareUrl(user.username)}
                  </a>
                  <CopyButton
                    text={getPublicStreamerShareUrl(user.username)}
                    label={copyLabel}
                    copiedMessage={copiedMessage}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('bots.embedHint') || 'Embed (iframe):'}</span>
                  <code className="text-xs break-all text-gray-700 dark:text-gray-300">{getPublicEmbedStreamerShareUrl(user.username)}</code>
                  <CopyButton text={getPublicEmbedStreamerShareUrl(user.username)} label={copyLabel} copiedMessage={copiedMessage} />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
