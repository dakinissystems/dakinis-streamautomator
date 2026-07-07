import React from 'react';
import { Key, RefreshCw, Copy, Check, ListTodo, Calendar, Radio } from 'lucide-react';
import CopyButton from './CopyButton';
import { API_BASE } from './constants';

export default function SettingsBotsIntegrationsPanel({
  t,
  streamMode,
  loading,
  apiKey,
  generating,
  handleGenerate,
  copyLabel,
  copiedMessage,
  nightbotMessage,
  copiedNightbot,
  copyNightbot,
}) {
  return (
    <>
      <div id="bots-api-key" className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800/80 dark:to-gray-800/50 p-5 sm:p-6 scroll-mt-4">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-medium mb-1">
          <Key className="w-5 h-5 text-indigo-500" />
          {t('bots.apiKeyLabel') || 'Your API key'}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('bots.apiKeyHint') || 'Use this key in Nightbot and in Streamer.bot, Mix It Up, StreamElements, etc. Keep it private.'}
        </p>
        {loading ? (
          <p className="text-sm text-gray-500">{t('common.loading') || 'Loading...'}</p>
        ) : apiKey ? (
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm font-mono text-gray-800 dark:text-gray-200 break-all max-w-full" title={streamMode ? undefined : apiKey}>
              {streamMode ? '••••••••••••••••' : apiKey}
            </code>
            {!streamMode && <CopyButton text={apiKey} label={copyLabel} copiedMessage={copiedMessage} />}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              {generating ? (t('bots.generating') || 'Generating...') : (t('bots.regenerate') || 'Regenerate')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? (t('bots.generating') || 'Generating...') : (t('bots.generateKey') || 'Generate API key')}
          </button>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 p-5 sm:p-6">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {t('bots.nightbotTitle') || 'Nightbot — !todo in chat'}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('bots.nightbotIntro') || 'When someone types !todo buy new mic, it appears in your Todos list.'}
        </p>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-semibold">1</span>
            <span className="text-gray-700 dark:text-gray-300">{t('bots.step1') || 'Nightbot dashboard → Commands → Custom → Add Command'}</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-semibold">2</span>
            <span className="text-gray-700 dark:text-gray-300">{t('bots.step2') || 'Command: !todo'}</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-semibold">3</span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-700 dark:text-gray-300 block mb-2">{t('bots.step3') || 'Message (paste this):'}</span>
              {!apiKey ? (
                <span className="text-amber-600 dark:text-amber-400 text-xs">{t('bots.generateKeyFirst') || 'Generate a key above first.'}</span>
              ) : streamMode ? (
                <span className="text-gray-500 dark:text-gray-400 text-xs">{t('common.streamModeHidden') || 'Hidden (stream mode is on)'}</span>
              ) : (
                <div className="flex flex-wrap items-start gap-2">
                  <code className="flex-1 min-w-0 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-3 py-2 text-xs break-all font-mono">
                    {nightbotMessage}
                  </code>
                  <button
                    type="button"
                    onClick={copyNightbot}
                    className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                  >
                    {copiedNightbot ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedNightbot ? (t('bots.copied') || 'Copied!') : copyLabel}
                  </button>
                </div>
              )}
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-semibold">4</span>
            <span className="text-gray-700 dark:text-gray-300">{t('bots.step4') || 'Userlevel: Moderator (recommended)'}</span>
          </li>
        </ol>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {t('bots.todosLink') || 'Todos show up in the Todos section of this app.'}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 p-5 sm:p-6">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {t('bots.webhooksTitle') || 'Streamer.bot, Mix It Up, StreamElements'}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('bots.webhooksDesc') || 'Same API key. In your bot, add a Web Request (POST) and use one of the URLs below. Put your key in the header X-API-Key.'}
        </p>
        <div className="space-y-3">
          <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-3 sm:p-4">
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-medium text-sm mb-1">
              <ListTodo className="w-4 h-4 text-indigo-500" />
              {t('bots.webhookTodo') || 'Add a todo'}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">POST — Body: {JSON.stringify({ text: 'your task' })}</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="text-xs break-all text-gray-700 dark:text-gray-300">{API_BASE}/api/webhooks/todo</code>
              <CopyButton text={`${API_BASE}/api/webhooks/todo`} label={copyLabel} copiedMessage={copiedMessage} />
            </div>
          </div>
          <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-3 sm:p-4">
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-medium text-sm mb-1">
              <Calendar className="w-4 h-4 text-indigo-500" />
              {t('bots.webhookEvent') || 'Create stream event'}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">POST — Body: {JSON.stringify({ title: 'Friday 20:00 Minecraft' })}</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="text-xs break-all text-gray-700 dark:text-gray-300">{API_BASE}/api/webhooks/events</code>
              <CopyButton text={`${API_BASE}/api/webhooks/events`} label={copyLabel} copiedMessage={copiedMessage} />
            </div>
          </div>
          <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-3 sm:p-4">
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-medium text-sm mb-1">
              <Radio className="w-4 h-4 text-indigo-500" />
              {t('bots.webhookStreamStart') || 'Mark stream started'}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">POST — Optional body: {JSON.stringify({})}</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="text-xs break-all text-gray-700 dark:text-gray-300">{API_BASE}/api/webhooks/stream/start</code>
              <CopyButton text={`${API_BASE}/api/webhooks/stream/start`} label={copyLabel} copiedMessage={copiedMessage} />
            </div>
          </div>
          <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-3 sm:p-4">
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-medium text-sm mb-1">
              <ListTodo className="w-4 h-4 text-indigo-500" />
              {t('bots.webhookIdeaNoteQuote') || '!idea / !note / !quote / !clipidea'}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">POST — Body: {JSON.stringify({ text: 'your text' })} — Or from Nightbot (GET): <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">idea/add?text=...</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">note/add?text=...</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">quote/add?quote=...</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">clipidea/add?text=...</code> (append <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">&amp;key=KEY</code>)</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="text-xs break-all text-gray-700 dark:text-gray-300">{API_BASE}/api/webhooks/idea</code>
              <CopyButton text={`${API_BASE}/api/webhooks/idea`} label={copyLabel} copiedMessage={copiedMessage} />
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
          {t('bots.webhooksExample') || 'Example: In Streamer.bot, when you go live → add action → Web Request → POST to the "Mark stream started" URL with header X-API-Key: your key.'}
        </p>
        <details className="group">
          <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            {t('bots.timelineWebhook') || 'POST /api/webhooks/timeline — Body: { "type": "clip", "payload": {} } to log stream moments (for timeline).'}
          </summary>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="text-xs break-all text-gray-700 dark:text-gray-300">{API_BASE}/api/webhooks/timeline</code>
            <CopyButton text={`${API_BASE}/api/webhooks/timeline`} label={copyLabel} copiedMessage={copiedMessage} />
          </div>
        </details>
      </div>

      <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-900/20 p-5 sm:p-6">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {t('bots.rouletteTitle')}
        </h4>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          {t('bots.rouletteIntro')}
        </p>
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/25 px-4 py-3 mb-4">
          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
            {t('bots.rouletteQuickStartTitle')}
          </p>
          <p className="text-sm text-emerald-800 dark:text-emerald-200/90 mt-1 leading-relaxed">
            {t('bots.rouletteQuickStartBody')}
          </p>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
          {t('bots.rouletteWhyBearer')}
        </p>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          {t('bots.rouletteAdvancedHeading')}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 p-3 text-xs">
            <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('bots.rouletteStepHttp')}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
              {t('bots.rouletteAuthExplain')}
            </p>
            <pre className="bg-gray-100 dark:bg-gray-800 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all text-gray-800 dark:text-gray-200">
              {`POST ${API_BASE}/api/roulette/spin\n${t('bots.rouletteAuthLine')}`}
            </pre>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              {t('bots.rouletteResponseHint')}
            </p>
            <pre className="bg-gray-100 dark:bg-gray-800 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all text-gray-800 dark:text-gray-200">
              {t('bots.rouletteExampleBody')}
            </pre>
          </div>
          <div className="rounded-lg bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 p-3 text-xs space-y-2">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {t('bots.rouletteStepCommand')}
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('bots.rouletteTemplateHint')}
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-700 dark:text-gray-300">
              <li>
                {t('bots.rouletteNightbotLabel')}:{' '}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{t('bots.rouletteNightbotCommand')}</code>
              </li>
              <li>
                {t('bots.rouletteStreamerbotLabel')}:{' '}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{t('bots.rouletteStreamerbotCommand')}</code>
              </li>
            </ul>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 pt-1 leading-relaxed">
              {t('bots.rouletteNote')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
