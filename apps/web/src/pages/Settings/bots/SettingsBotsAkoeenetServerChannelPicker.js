import React from 'react';
import { AlertCircle, Server, Hash } from 'lucide-react';

export default function SettingsBotsAkoeenetServerChannelPicker({
  t,
  akoenetServerId,
  setAkoenetServerId,
  akoenetChannelId,
  setAkoenetChannelId,
  akoenetGuilds,
  akoenetChannels,
  loadingAkoenetGuilds,
  loadingAkoenetChannels,
  guildInList,
  akoenetGuildsError,
  akoenetManualTargets,
  akoenetConfigured,
  akoenetGuildsEmpty,
  streamMode,
}) {
  return (
    <>
      {akoenetGuildsError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{akoenetGuildsError}</span>
        </div>
      )}

      {akoenetConfigured && !akoenetManualTargets && !streamMode && !akoenetGuildsEmpty && (
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[180px] flex-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              <Server className="w-3.5 h-3.5 inline mr-1 align-text-bottom" />
              {t('bots.akoenetSelectServer') || 'Servidor AkoeNet'}
            </label>
            <select
              value={akoenetServerId}
              onChange={(e) => {
                setAkoenetServerId(e.target.value);
                setAkoenetChannelId('');
              }}
              disabled={loadingAkoenetGuilds || !!akoenetGuildsError}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
            >
              <option value="">
                {loadingAkoenetGuilds
                  ? t('common.loading') || '…'
                  : t('bots.akoenetChooseServer') || 'Elegir servidor'}
              </option>
              {akoenetGuilds.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              <Hash className="w-3.5 h-3.5 inline mr-1 align-text-bottom" />
              {t('bots.akoenetSelectChannel') || 'Canal de anuncios'}
            </label>
            <select
              value={akoenetChannelId}
              onChange={(e) => setAkoenetChannelId(e.target.value)}
              disabled={!akoenetServerId || loadingAkoenetChannels || !guildInList}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
            >
              <option value="">
                {loadingAkoenetChannels
                  ? t('common.loading') || '…'
                  : t('bots.akoenetChooseChannel') || 'Elegir canal'}
              </option>
              {akoenetChannels.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {akoenetManualTargets && akoenetConfigured && !streamMode && (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {t('bots.akoenetManualChannelHint') ||
            'Tu instancia AkoeNet aún no expone la lista de servidores por API. Usa el ID de canal manualmente o actualiza AkoeNet (GET …/integrations/scheduler/servers).'}
        </p>
      )}

      {akoenetGuildsEmpty && akoenetConfigured && !streamMode && (
        <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {t('bots.akoenetNoServersHint') ||
            'No hay servidores en la respuesta de AkoeNet. Comprueba la API o introduce el ID del canal abajo.'}
        </p>
      )}

      {(akoenetManualTargets || !akoenetConfigured || akoenetGuildsEmpty) && (
        <div>
          <label htmlFor="akoenetAnnounceChannelId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('bots.akoenetChannelId') || 'Channel ID (optional)'}
          </label>
          <input
            id="akoenetAnnounceChannelId"
            type="text"
            autoComplete="off"
            value={akoenetChannelId}
            onChange={(e) => setAkoenetChannelId(e.target.value)}
            disabled={streamMode}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm disabled:opacity-60"
            placeholder={t('bots.akoenetChannelIdPlaceholder') || 'Override announce channel in payload (optional)'}
          />
        </div>
      )}

      {akoenetConfigured && !akoenetManualTargets && !streamMode && !akoenetGuildsEmpty && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('bots.akoenetPickerHint') ||
            'Elige servidor y canal como en Discord; se guarda el canal en el webhook (channel_id).'}
        </p>
      )}
    </>
  );
}
