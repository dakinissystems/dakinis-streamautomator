import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getNightbotKey, generateNightbotKey } from '../../../features/integrations/api';
import { devCatchLog } from '../../../utils/devCatchLog';
import { API_BASE, NIGHTBOT_TODO_URL } from './constants';

export function useSettingsBotsNightbot({ token, t, streamMode }) {
  const [key, setKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedNightbot, setCopiedNightbot] = useState(false);

  const fetchKey = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const k = await getNightbotKey();
      setKey(k);
    } catch (e) {
      devCatchLog('SettingsBotsTab.fetchNightbotKey', e);
      setKey(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKey();
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-doctor/exhaustive-deps -- fetchKey on mount and when token changes
  }, [token]);

  const handleGenerate = async () => {
    if (key && !window.confirm(t('bots.regenerateConfirm') || 'This will invalidate your current API key. Bots using the old key will stop working. Continue?')) {
      return;
    }
    setGenerating(true);
    try {
      const newKey = await generateNightbotKey();
      setKey(newKey);
      toast.success(t('bots.keyGenerated') || 'Key generated. Use it in Nightbot and other bots.');
    } catch (err) {
      toast.error(err.response?.data?.error || t('bots.keyGenerateFailed') || 'Failed to generate key');
    } finally {
      setGenerating(false);
    }
  };

  const nightbotMessage = !streamMode && key && NIGHTBOT_TODO_URL
    ? `$(urlfetch ${NIGHTBOT_TODO_URL}?key=${encodeURIComponent(key)}&text=$(query)&user=$(user)&channel=$(channel))`
    : '';

  const copyNightbot = () => {
    if (!nightbotMessage) return;
    navigator.clipboard.writeText(nightbotMessage).then(() => {
      setCopiedNightbot(true);
      toast.success(t('bots.copied') || 'Copied to clipboard');
      setTimeout(() => setCopiedNightbot(false), 2000);
    });
  };

  const getChatUrl = (path) => !streamMode && key && API_BASE ? `${API_BASE}/api/webhooks/${path}?key=${encodeURIComponent(key)}` : '';
  const getNightbotMsg = (path) => !streamMode && key && API_BASE ? `$(urlfetch ${API_BASE}/api/webhooks/${path}?key=${encodeURIComponent(key)})` : '';

  return {
    key,
    loading,
    generating,
    copiedNightbot,
    nightbotMessage,
    handleGenerate,
    copyNightbot,
    getChatUrl,
    getNightbotMsg,
  };
}
