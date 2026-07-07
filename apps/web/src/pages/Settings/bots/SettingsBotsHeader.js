import React from 'react';
import { Bot, Zap, Link2, Key, Monitor, MessageSquare } from 'lucide-react';

export default function SettingsBotsHeader({ t, botsSub, setBotsSub }) {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <Bot className="w-5 h-5 text-indigo-500" />
        {t('bots.title') || 'Bots & integrations'}
      </h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 max-w-xl">
        {t('bots.description') || 'Connect Nightbot, Streamer.bot, Mix It Up and StreamElements. One API key works for all.'}
      </p>
      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm">
        <Zap className="w-4 h-4" />
        {t('bots.setupInMinutes') || 'Setup in ~2 minutes'}
      </div>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
        {t('bots.subTabsIntro') || 'Use the tabs below to focus on one area: community link, API & bot tools, OBS overlays, or chat commands and public links.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'community', label: t('bots.subTabCommunity') || 'AkoeNet & community', Icon: Link2 },
          { id: 'integrations', label: t('bots.subTabIntegrations') || 'API key & integrations', Icon: Key },
          { id: 'overlays', label: t('bots.subTabOverlays') || 'OBS overlays', Icon: Monitor },
          { id: 'commands', label: t('bots.subTabCommands') || 'Commands & links', Icon: MessageSquare },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setBotsSub(id)}
            className={`inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors rounded-t-md ${
              botsSub === id
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
