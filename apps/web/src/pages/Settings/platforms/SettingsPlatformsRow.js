import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PLATFORM_ICONS, MailIcon } from './constants';

export default function SettingsPlatformsRow({
  platform,
  t,
  tSafe,
  connectedAccounts,
  akoenetConnected,
  connectingKey,
  disconnectingKey,
  token,
  onConnect,
  onDisconnect,
  fetchConnectedAccounts,
  onTwitchPublishConnect,
  onOpenAkoenetAutoConnect,
}) {
  const navigate = useNavigate();
  const { key, label, labelKey, noConnect } = platform;
  const labelText = label || t(labelKey);
  const connected = key === 'akoenet' ? akoenetConnected : connectedAccounts[key];
  const username = connectedAccounts.usernames?.[key];
  const connect = noConnect ? null : () => onConnect(key);
  const disconnect = noConnect ? null : () => onDisconnect(key);
  const IconComponent = PLATFORM_ICONS[key] || MailIcon;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <IconComponent />
          <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{labelText}</span>
            {key === 'akoenet' && (
              <span className="px-2 py-0.5 text-[10px] uppercase tracking-wide rounded bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200">
                {t('settings.akoenetPrimaryBadge') || 'Recommended'}
              </span>
            )}
            {connected && username && (
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">({username})</span>
            )}
            <span className={`px-2 py-0.5 text-xs rounded flex-shrink-0 ${connected ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
              {connected ? (t('settings.connected') || 'Connected') : (t('settings.notConnected') || 'Not connected')}
            </span>
          </div>
        </div>
        {connect && !connected && (
          <button
            type="button"
            onClick={connect}
            disabled={connectingKey === key}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-wait flex-shrink-0"
          >
            {connectingKey === key ? (t('common.loading') || '...') : (t('settings.connect') || 'Connect')}
          </button>
        )}
        {key === 'akoenet' && (
          <button
            type="button"
            onClick={() => {
              if (typeof onOpenAkoenetAutoConnect === 'function') {
                onOpenAkoenetAutoConnect();
                return;
              }
              navigate('/akoenet/connect');
            }}
            disabled={connectingKey === 'akoenet'}
            className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex-shrink-0"
          >
            {connectingKey === 'akoenet'
              ? (t('common.loading') || '...')
              : (connected ? (t('settings.manage') || 'Manage') : (t('settings.connect') || 'Connect'))}
          </button>
        )}
        {disconnect && connected && (
          <button
            type="button"
            onClick={async () => {
              if (!window.confirm(t('settings.disconnectConfirm') || 'Disconnect this platform? You can reconnect later.')) return;
              try {
                await onDisconnect(key);
              } catch (err) {
                if (token && fetchConnectedAccounts) fetchConnectedAccounts();
              }
            }}
            disabled={disconnectingKey !== null}
            className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 flex-shrink-0"
          >
            {disconnectingKey === key ? (t('common.loading') || '...') : (t('settings.disconnect') || 'Disconnect')}
          </button>
        )}
      </div>
      {key === 'discord' && (
        <p className="text-xs text-gray-500 dark:text-gray-400 pl-8">
          {t('settings.discordOptionalHint') || 'Optional — connect if you publish Twitch clips to Discord or use Discord bots.'}
        </p>
      )}
      {key === 'email' && !connected && (
        <p className="text-xs text-gray-500 dark:text-gray-400 pl-8">
          {t('settings.setPasswordInSecurity') || 'Set a password in Security tab.'}
        </p>
      )}
      {key === 'twitter' && connected && connectedAccounts.twitterTokenMissing && (
        <p className="text-xs text-amber-600 dark:text-amber-400 pl-8">
          {t('settings.twitterReconnectToPublish') || 'Access token missing. Disconnect and reconnect X (Twitter) to enable publishing.'}
        </p>
      )}
      {key === 'twitch' && onTwitchPublishConnect && !connectedAccounts.twitchPublishConnected && (
        <p className="text-xs text-gray-600 dark:text-gray-400 pl-8">
          {t('settings.twitchPublishConnectHint')}{' '}
          <button
            type="button"
            onClick={onTwitchPublishConnect}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {t('settings.twitchConnectForPublish')}
          </button>
        </p>
      )}
      {key === 'twitch' && connectedAccounts.twitchPublishConnected && (
        <p className="text-xs text-green-600 dark:text-green-400 pl-8">
          {t('settings.twitchPublishConnected') || 'Connected for scheduling and bits.'}
        </p>
      )}
      {key === 'youtube' && connected && (
        <p className="text-xs text-green-600 dark:text-green-400 pl-8">
          {t('settings.youtubePublishConnected') || 'Connected for video uploads.'}
        </p>
      )}
      {key === 'akoenet' && connected && (
        <p className="text-xs text-green-600 dark:text-green-400 pl-8">
          {t('settings.akoenetConfigured') || 'Connected. You can change the server, channel, or other options in Settings → Bots → AkoeNet.'}
        </p>
      )}
      {key === 'akoenet' && !connected && (
        <p className="text-xs text-gray-600 dark:text-gray-400 pl-8">
          {tSafe(
            'settings.akoenetNotConfigured',
            'Not connected yet. Use Connect on AkoeNet above, or go to Settings → Bots → AkoeNet and sign in again if your host already set up the link—then pick your server and channel.'
          )}
        </p>
      )}
    </div>
  );
}
