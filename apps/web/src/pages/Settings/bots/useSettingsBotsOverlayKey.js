import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getOverlayKey, generateOverlayKey, getNightbotKey } from '../../../features/integrations/api';
import { devCatchLog } from '../../../utils/devCatchLog';

/**
 * Overlay OBS key (preferred). Falls back to nightbot key for URL display until user generates overlay key.
 */
export function useSettingsBotsOverlayKey({ token, t, streamMode }) {
  const [key, setKey] = useState(null);
  const [legacyFallback, setLegacyFallback] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchKey = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const overlay = await getOverlayKey();
      if (overlay) {
        setKey(overlay);
        setLegacyFallback(false);
      } else {
        const nightbot = await getNightbotKey();
        setKey(nightbot);
        setLegacyFallback(!!nightbot);
      }
    } catch (e) {
      devCatchLog('SettingsBotsTab.fetchOverlayKey', e);
      setKey(null);
      setLegacyFallback(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKey();
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-doctor/exhaustive-deps
  }, [token]);

  const handleGenerate = async () => {
    if (key && !legacyFallback && !window.confirm(t('bots.regenerateOverlayConfirm') || 'This will invalidate your current overlay key. OBS browser sources using the old key will stop. Continue?')) {
      return;
    }
    setGenerating(true);
    try {
      const newKey = await generateOverlayKey();
      setKey(newKey);
      setLegacyFallback(false);
      toast.success(t('bots.overlayKeyGenerated') || 'Overlay key generated. Update OBS browser source URLs.');
    } catch (err) {
      toast.error(err.response?.data?.error || t('bots.keyGenerateFailed') || 'Failed to generate key');
    } finally {
      setGenerating(false);
    }
  };

  return {
    key: streamMode ? null : key,
    rawKey: key,
    legacyFallback,
    loading,
    generating,
    handleGenerate,
  };
}
