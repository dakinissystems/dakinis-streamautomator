import { useState } from 'react';
import toast from 'react-hot-toast';
import { isLegacyAkoenetHost, normalizeAkoenetWebhookUrl } from '../../../shared/config/akoenetIntegration';
import { apiClient } from '../../../shared/api/client';
import { useAkoenetDiscovery } from './useAkoenetDiscovery';

export function useSettingsBotsAkoeenet({ user, token, t, setUser, streamMode }) {
  const userAkoenetSyncKey = [
    user?.id,
    user?.akoenetWebhookUrl,
    user?.akoenetAnnounceChannelId,
    user?.akoenetServerId,
    user?.akoenetSendClips,
  ].join('|');
  const [userAkoenetSync, setUserAkoenetSync] = useState(userAkoenetSyncKey);
  const [akoenetUrl, setAkoenetUrl] = useState('');
  const [akoenetSecret, setAkoenetSecret] = useState('');
  const [akoenetChannelId, setAkoenetChannelId] = useState('');
  const [akoenetSendClips, setAkoenetSendClips] = useState(false);
  const [akoenetSaving, setAkoenetSaving] = useState(false);
  const [akoenetServerId, setAkoenetServerId] = useState('');

  if (userAkoenetSyncKey !== userAkoenetSync) {
    setUserAkoenetSync(userAkoenetSyncKey);
    const raw = user?.akoenetWebhookUrl || '';
    setAkoenetUrl(raw ? normalizeAkoenetWebhookUrl(raw) : '');
    setAkoenetChannelId(user?.akoenetAnnounceChannelId || '');
    setAkoenetServerId(user?.akoenetServerId || '');
    setAkoenetSendClips(user?.akoenetSendClips === true);
    setAkoenetSecret('');
  }

  const akoenetPerUserConfigured =
    !!(user?.akoenetWebhookUrl && String(user.akoenetWebhookUrl).trim() && user?.akoenetWebhookSecretSet);
  const akoenetConfigured =
    akoenetPerUserConfigured || user?.akoenetGlobalWebhookConfigured === true;
  const akoenetHostOnlyMode = !akoenetPerUserConfigured && user?.akoenetGlobalWebhookConfigured === true;

  const {
    akoenetGuilds,
    akoenetChannels,
    akoenetGuildsError,
    akoenetManualTargets,
    loadingAkoenetGuilds,
    loadingAkoenetChannels,
    guildInList,
  } = useAkoenetDiscovery({
    token,
    akoenetConfigured,
    streamMode,
    user,
    akoenetServerId,
    t,
  });

  const akoenetLegacyUrl = !streamMode && !!akoenetUrl && isLegacyAkoenetHost(akoenetUrl);

  const handleSaveAkoeNet = async (clearSecret = false) => {
    if (!token) return;
    setAkoenetSaving(true);
    try {
      const payload = {
        akoenetWebhookUrl: akoenetUrl.trim() || null,
        akoenetAnnounceChannelId: akoenetChannelId.trim() || null,
        akoenetServerId: akoenetServerId.trim() || null,
        akoenetSendClips,
      };
      if (clearSecret) {
        payload.akoenetWebhookSecret = null;
      } else if (akoenetSecret.trim()) {
        payload.akoenetWebhookSecret = akoenetSecret.trim();
      }
      const response = await apiClient.put('/user/profile', payload, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      if (setUser && response.data?.user) {
        setUser({ ...user, ...response.data.user });
      }
      setAkoenetSecret('');
      toast.success(t('bots.akoenetSaved') || 'AkoeNet settings saved.');
    } catch (err) {
      const msg = err.response?.data?.details
        ? (Array.isArray(err.response.data.details) ? err.response.data.details.map((d) => d.message).join('. ') : err.response.data.details)
        : err.response?.data?.error || err.message || t('settings.profileUpdateFailed');
      toast.error(msg);
    } finally {
      setAkoenetSaving(false);
    }
  };

  const akoenetGuildsEmpty =
    akoenetConfigured &&
    !akoenetManualTargets &&
    !loadingAkoenetGuilds &&
    !akoenetGuildsError &&
    akoenetGuilds.length === 0;

  const akoenetPickerComplete =
    akoenetConfigured &&
    !akoenetManualTargets &&
    !akoenetGuildsError &&
    !akoenetGuildsEmpty &&
    String(akoenetServerId || '').trim() !== '' &&
    String(akoenetChannelId || '').trim() !== '';

  const hideAkoeNetWebhookFieldsInMain =
    akoenetHostOnlyMode || (akoenetPerUserConfigured && akoenetPickerComplete);

  return {
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
  };
}
