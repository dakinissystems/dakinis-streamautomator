import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { PLATFORMS_ACCOUNT, PLATFORMS_COMMUNITY } from './platforms/constants';
import { useDiscordClips } from './platforms/useDiscordClips';
import SettingsPlatformsRow from './platforms/SettingsPlatformsRow';
import SettingsPlatformsDiscordClipsPanel from './platforms/SettingsPlatformsDiscordClipsPanel';

export default function SettingsPlatformsTab({
  user,
  connectedAccounts,
  setConnectedAccounts,
  connectedAccountsLoading,
  disconnectingKey,
  connectingKey,
  token,
  t,
  onConnect,
  onDisconnect,
  fetchConnectedAccounts,
  onTwitchPublishConnect,
  onSaveClipsChannel,
  onOpenBotsSettings,
  onOpenAkoenetAutoConnect,
}) {
  const { tSafe } = useLanguage();
  const discordConnected = connectedAccounts?.discord === true;
  const userClipsGuildId = user?.discordClipsGuildId || '';
  const userClipsChannelId = user?.discordClipsChannelId || '';
  const userSendClipsToAkoenet = user?.akoenetSendClips === true;
  const [sendClipsToAkoenet, setSendClipsToAkoenet] = useState(userSendClipsToAkoenet);
  const [savingClipsChannel, setSavingClipsChannel] = useState(false);
  const akoenetConnected = Boolean(
    (user?.akoenetWebhookUrl && String(user.akoenetWebhookUrl).trim() && user?.akoenetWebhookSecretSet) ||
      user?.akoenetGlobalWebhookConfigured === true
  );

  const {
    clipsGuildId,
    clipsChannelId,
    clipsGuilds,
    clipsChannels,
    clipsGuildsError,
    loadingClipsGuilds,
    loadingClipsChannels,
    syncClipsFromUser,
    setClipsGuildId,
    setClipsChannelId,
  } = useDiscordClips({
    discordConnected,
    token,
    disconnectingKey,
    userClipsGuildId,
    userClipsChannelId,
    t,
  });

  const [prevUserClipsSync, setPrevUserClipsSync] = useState({
    guild: userClipsGuildId,
    channel: userClipsChannelId,
    akoenet: userSendClipsToAkoenet,
  });

  if (
    userClipsGuildId !== prevUserClipsSync.guild
    || userClipsChannelId !== prevUserClipsSync.channel
    || userSendClipsToAkoenet !== prevUserClipsSync.akoenet
  ) {
    setPrevUserClipsSync({
      guild: userClipsGuildId,
      channel: userClipsChannelId,
      akoenet: userSendClipsToAkoenet,
    });
    syncClipsFromUser(userClipsGuildId, userClipsChannelId);
    setSendClipsToAkoenet(userSendClipsToAkoenet);
  }

  /* --- Instagram Graph (Meta): commented out until backend + tokens are production-ready. Restore api imports, state, loadInstagram, and block below. ---
  const [igAccount, setIgAccount] = useState(null);
  const [igPosts, setIgPosts] = useState([]);
  const [igLoading, setIgLoading] = useState(false);
  const [igPostsLoading, setIgPostsLoading] = useState(false);
  const [igError, setIgError] = useState(null);
  const [igNotConfigured, setIgNotConfigured] = useState(false);
  const [insightsById, setInsightsById] = useState({});
  const [insightsLoadingId, setInsightsLoadingId] = useState(null);

  const loadInstagram = React.useCallback(async () => {
    if (!token) return;
    setIgLoading(true);
    setIgPostsLoading(true);
    setIgError(null);
    setIgNotConfigured(false);
    setIgAccount(null);
    setIgPosts([]);
    try {
      const account = await getInstagramAccount();
      setIgAccount(account);
      try {
        const postsRes = await getInstagramPosts(5);
        setIgPosts(postsRes?.data || []);
      } catch (e) {
        devCatchLog('SettingsPlatformsTab.getInstagramPosts', e);
        setIgPosts([]);
      }
    } catch (err) {
      const code = err.response?.data?.code;
      if (err.response?.status === 503 && code === 'instagram_not_configured') {
        setIgNotConfigured(true);
      } else {
        setIgError(err.response?.data?.error || err.message);
      }
    } finally {
      setIgLoading(false);
      setIgPostsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setIgAccount(null);
      setIgPosts([]);
      setIgError(null);
      setIgNotConfigured(false);
      return;
    }
    loadInstagram();
  }, [token, loadInstagram]);
  */

  const handleSaveClipsChannel = async () => {
    if (typeof onSaveClipsChannel !== 'function') return;
    setSavingClipsChannel(true);
    try {
      await onSaveClipsChannel(clipsGuildId || null, clipsChannelId || null, sendClipsToAkoenet);
    } finally {
      setSavingClipsChannel(false);
    }
  };

  const rowProps = {
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
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
        {t('settings.platformsConnectTitle') || 'Connect platforms'}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {t('settings.connectedAccountsDescription') || 'Link other sign-in methods to this account. You can then use any of them to log in.'}
      </p>
      {connectedAccountsLoading ? (
        <p className="text-sm text-gray-500">{t('common.loading') || 'Loading...'}</p>
      ) : connectedAccounts ? (
        <div className="space-y-4">
          {PLATFORMS_ACCOUNT.map((platform) => (
            <SettingsPlatformsRow platform={platform} {...rowProps} key={platform.key} />
          ))}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('settings.communityPlatformsTitle') || 'Community (announcements & clips)'}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t('settings.communityPlatformsIntro') || 'AkoeNet is the recommended place for your community (like Discord). Discord remains optional for clips and legacy bots.'}
            </p>
            {PLATFORMS_COMMUNITY.map((platform) => (
              <SettingsPlatformsRow platform={platform} {...rowProps} key={platform.key} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">{t('settings.couldNotLoadAccounts') || 'Could not load connected accounts.'}</p>
      )}

      {/* Instagram Graph UI: see block comment above (state + loadInstagram) and integrations/api.js */}

      {discordConnected && onSaveClipsChannel && (
        <SettingsPlatformsDiscordClipsPanel
          t={t}
          sendClipsToAkoenet={sendClipsToAkoenet}
          setSendClipsToAkoenet={setSendClipsToAkoenet}
          clipsGuildsError={clipsGuildsError}
          loadingClipsGuilds={loadingClipsGuilds}
          clipsGuilds={clipsGuilds}
          clipsGuildId={clipsGuildId}
          setClipsGuildId={setClipsGuildId}
          clipsChannelId={clipsChannelId}
          setClipsChannelId={setClipsChannelId}
          loadingClipsChannels={loadingClipsChannels}
          clipsChannels={clipsChannels}
          savingClipsChannel={savingClipsChannel}
          onSave={handleSaveClipsChannel}
        />
      )}
    </div>
  );
}
