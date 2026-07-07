/**
 * Bots integration: Nightbot, Streamer.bot, Mix It Up, StreamElements.
 * Streamer-friendly layout: quick setup, command table, copy-paste ready docs.
 */
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStreamMode } from '../../contexts/StreamModeContext';
import { BOTS_SUB_IDS, FRONTEND_ORIGIN } from './bots/constants';
import { useSettingsBotsAkoeenet } from './bots/useSettingsBotsAkoeenet';
import { useSettingsBotsNightbot } from './bots/useSettingsBotsNightbot';
import { buildChatCommands } from './bots/chatCommands';
import { buildOverlayItems } from './bots/overlayItems';
import SettingsBotsHeader from './bots/SettingsBotsHeader';
import SettingsBotsAkoeenetPanel from './bots/SettingsBotsAkoeenetPanel';
import SettingsBotsIntegrationsPanel from './bots/SettingsBotsIntegrationsPanel';
import SettingsBotsOverlaysPanel from './bots/SettingsBotsOverlaysPanel';
import SettingsBotsCommandsPanel from './bots/SettingsBotsCommandsPanel';

export default function SettingsBotsTab({ user, token, t, setUser }) {
  const { streamMode } = useStreamMode();
  const [searchParams, setSearchParams] = useSearchParams();
  const botsSubParam = searchParams.get('botsSub');
  const botsSub = BOTS_SUB_IDS.includes(botsSubParam) ? botsSubParam : 'community';
  const [overlaySectionOpen, setOverlaySectionOpen] = useState(true);

  const setBotsSub = (next) => {
    if (!BOTS_SUB_IDS.includes(next)) return;
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set('tab', 'bots');
        p.set('botsSub', next);
        return p;
      },
      { replace: true }
    );
  };

  const akoenet = useSettingsBotsAkoeenet({ user, token, t, setUser, streamMode });
  const nightbot = useSettingsBotsNightbot({ token, t, streamMode });

  const copyLabel = t('bots.copy') || 'Copy';
  const copiedMessage = t('bots.copied') || 'Copied';
  const chatCommands = buildChatCommands(t);
  const overlayItems = buildOverlayItems(t);
  const getOverlayUrl = (path) => !streamMode && nightbot.key && FRONTEND_ORIGIN ? `${FRONTEND_ORIGIN}/overlay/${path}?key=${encodeURIComponent(nightbot.key)}` : '';

  const scrollToId = (id) => {
    if (!id) return;
    if (id.startsWith('cmd-')) {
      setBotsSub('commands');
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      return;
    }
    const idToTab = {
      'bots-akoenet': 'community',
      'bots-api-key': 'integrations',
      'bots-overlays': 'overlays',
      'bots-chat-commands': 'commands',
      'bots-public-schedule': 'commands',
    };
    const tab = idToTab[id];
    if (tab) {
      setBotsSub(tab);
      window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-8">
      <SettingsBotsHeader t={t} botsSub={botsSub} setBotsSub={setBotsSub} />

      {streamMode && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-amber-800 dark:text-amber-200 text-sm">
          {t('common.streamModeBotsHint') || 'Stream mode is on — API key and URLs are hidden. Turn it off in the header to view or copy them.'}
        </div>
      )}

      {botsSub === 'community' && (
        <SettingsBotsAkoeenetPanel t={t} streamMode={streamMode} user={user} {...akoenet} />
      )}

      {botsSub === 'integrations' && (
        <SettingsBotsIntegrationsPanel
          t={t}
          streamMode={streamMode}
          loading={nightbot.loading}
          apiKey={nightbot.key}
          generating={nightbot.generating}
          handleGenerate={nightbot.handleGenerate}
          copyLabel={copyLabel}
          copiedMessage={copiedMessage}
          nightbotMessage={nightbot.nightbotMessage}
          copiedNightbot={nightbot.copiedNightbot}
          copyNightbot={nightbot.copyNightbot}
        />
      )}

      {botsSub === 'overlays' && (
        <SettingsBotsOverlaysPanel
          t={t}
          streamMode={streamMode}
          apiKey={nightbot.key}
          overlaySectionOpen={overlaySectionOpen}
          setOverlaySectionOpen={setOverlaySectionOpen}
          overlayItems={overlayItems}
          getOverlayUrl={getOverlayUrl}
          copiedMessage={copiedMessage}
        />
      )}

      {botsSub === 'commands' && (
        <SettingsBotsCommandsPanel
          t={t}
          streamMode={streamMode}
          user={user}
          apiKey={nightbot.key}
          chatCommands={chatCommands}
          getChatUrl={nightbot.getChatUrl}
          getNightbotMsg={nightbot.getNightbotMsg}
          copyLabel={copyLabel}
          copiedMessage={copiedMessage}
          scrollToId={scrollToId}
        />
      )}
    </div>
  );
}
