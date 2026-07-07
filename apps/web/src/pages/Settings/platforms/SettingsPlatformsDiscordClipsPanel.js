import React from 'react';
import { Save, Server, AlertCircle } from 'lucide-react';
import { getDiscordInviteUrl } from '../../../features/discord/api';
import { devCatchLog } from '../../../utils/devCatchLog';

export default function SettingsPlatformsDiscordClipsPanel({
  t,
  sendClipsToAkoenet,
  setSendClipsToAkoenet,
  clipsGuildsError,
  loadingClipsGuilds,
  clipsGuilds,
  clipsGuildId,
  setClipsGuildId,
  clipsChannelId,
  setClipsChannelId,
  loadingClipsChannels,
  clipsChannels,
  savingClipsChannel,
  onSave,
}) {
  return (
    <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {t('settings.discordClipsChannelTitle') || 'Canal para clips de Twitch'}
      </h4>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        {t('settings.discordClipsChannelDescription') || 'Los clips de Twitch se publicarán automáticamente en el canal que elijas.'}
      </p>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={sendClipsToAkoenet}
          onChange={(e) => setSendClipsToAkoenet(e.target.checked)}
          className="mt-1 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
        />
        <span>
          <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
            {t('settings.akoenetClipsToggleLabel') || 'También publicar clips en AkoeNet'}
          </span>
          <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t('settings.akoenetClipsToggleHint') || 'Turn this on to send automatic Twitch clips to AkoeNet too.'}
          </span>
        </span>
      </label>
      {clipsGuildsError && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-amber-800 dark:text-amber-200">{clipsGuildsError}</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">{t('settings.clipsErrorHint') || 'Disconnect and reconnect Discord in Settings, or add the bot to a server you own.'}</p>
          </div>
        </div>
      )}
      {!loadingClipsGuilds && clipsGuilds.length === 0 && !clipsGuildsError && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Server className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">{t('settings.clipsNoServersTitle')}</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{t('settings.clipsNoServersHint')}</p>
            <button
              type="button"
              onClick={async () => {
                try {
                  const { inviteUrl } = await getDiscordInviteUrl();
                  if (inviteUrl) window.open(inviteUrl, '_blank', 'noopener,noreferrer');
                } catch (e) {
                  devCatchLog('SettingsPlatformsTab.getDiscordInviteUrl', e);
                }
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4]"
            >
              <Server className="w-4 h-4" />
              {t('settings.addBotButton') || t('discord.addBotButton') || 'Add bot to server'}
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            {t('settings.discordServer') || 'Servidor'}
          </label>
          <select
            value={clipsGuildId}
            onChange={(e) => setClipsGuildId(e.target.value)}
            disabled={loadingClipsGuilds}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
          >
            <option value="">{loadingClipsGuilds ? (t('common.loading') || '...') : (t('settings.selectServer') || 'Seleccionar servidor')}</option>
            {clipsGuilds.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            {t('settings.discordChannel') || 'Canal'}
          </label>
          <select
            value={clipsChannelId}
            onChange={(e) => setClipsChannelId(e.target.value)}
            disabled={!clipsGuildId || loadingClipsChannels}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
          >
            <option value="">{loadingClipsChannels ? (t('common.loading') || '...') : (t('settings.selectChannel') || 'Seleccionar canal')}</option>
            {clipsChannels.map((c) => (
              <option key={c.id} value={c.id}>#{c.name}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={savingClipsChannel}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 text-sm"
        >
          <Save className="w-4 h-4" />
          {savingClipsChannel ? (t('common.loading') || '...') : (t('common.save') || 'Guardar')}
        </button>
      </div>
    </div>
  );
}
