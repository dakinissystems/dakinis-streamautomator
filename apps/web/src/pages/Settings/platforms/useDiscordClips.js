import { useReducer, useEffect } from 'react';
import { getDiscordGuilds, getDiscordChannels } from '../../../features/discord/api';

const initialClipsState = {
  guildId: '',
  channelId: '',
  guilds: [],
  channels: [],
  guildsError: null,
  loadingGuilds: false,
  loadingChannels: false,
};

function discordClipsReducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return { ...initialClipsState };
    case 'SYNC_FROM_USER':
      return {
        ...state,
        guildId: action.guildId || '',
        channelId: action.channelId || '',
      };
    case 'SET_GUILD_ID':
      return {
        ...state,
        guildId: action.guildId,
        channelId: '',
        channels: [],
      };
    case 'SET_CHANNEL_ID':
      return {
        ...state,
        channelId: action.channelId,
      };
    case 'LOAD_GUILDS_START':
      return {
        ...state,
        loadingGuilds: true,
        guildsError: null,
      };
    case 'LOAD_GUILDS_SUCCESS':
      return {
        ...state,
        guilds: action.guilds,
        guildsError: null,
        loadingGuilds: false,
      };
    case 'LOAD_GUILDS_ERROR':
      return {
        ...state,
        guilds: [],
        guildId: '',
        channelId: '',
        channels: [],
        guildsError: action.error,
        loadingGuilds: false,
      };
    case 'RESET_CHANNELS':
      return {
        ...state,
        channels: [],
        loadingChannels: false,
      };
    case 'CLEAR_SELECTION':
      return {
        ...state,
        guildId: '',
        channelId: '',
        channels: [],
        loadingChannels: false,
      };
    case 'LOAD_CHANNELS_START':
      return {
        ...state,
        loadingChannels: true,
        channels: [],
      };
    case 'LOAD_CHANNELS_SUCCESS':
      return {
        ...state,
        channels: action.channels,
        loadingChannels: false,
      };
    case 'LOAD_CHANNELS_ERROR':
      return action.clearSelection
        ? {
            ...state,
            guildId: '',
            channelId: '',
            channels: [],
            loadingChannels: false,
          }
        : {
            ...state,
            channels: [],
            loadingChannels: false,
          };
    default:
      return state;
  }
}

export function useDiscordClips({
  discordConnected,
  token,
  disconnectingKey,
  userClipsGuildId,
  userClipsChannelId,
  t,
}) {
  const [clips, dispatch] = useReducer(discordClipsReducer, {
    ...initialClipsState,
    guildId: userClipsGuildId || '',
    channelId: userClipsChannelId || '',
  });

  useEffect(() => {
    if (!discordConnected || !token || disconnectingKey === 'discord') {
      dispatch({ type: 'RESET' });
      return;
    }
    let cancelled = false;
    dispatch({ type: 'LOAD_GUILDS_START' });
    getDiscordGuilds()
      .then((data) => {
        if (!cancelled) {
          dispatch({ type: 'LOAD_GUILDS_SUCCESS', guilds: data.guilds || [] });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const msg = err.response?.data?.error || err.response?.data?.details || err.message;
          dispatch({
            type: 'LOAD_GUILDS_ERROR',
            error: msg || t('settings.clipsGuildsLoadFailed'),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [discordConnected, token, disconnectingKey, t]);

  const guildInList = clips.guilds.some((g) => g.id === clips.guildId);

  useEffect(() => {
    if (!clips.guildId || !discordConnected || disconnectingKey === 'discord') {
      dispatch({ type: 'RESET_CHANNELS' });
      return;
    }
    if (clips.loadingGuilds || clips.guildsError) return;
    if (!guildInList) {
      dispatch({ type: 'CLEAR_SELECTION' });
      return;
    }
    let cancelled = false;
    dispatch({ type: 'LOAD_CHANNELS_START' });
    getDiscordChannels(clips.guildId)
      .then((data) => {
        if (!cancelled) {
          dispatch({ type: 'LOAD_CHANNELS_SUCCESS', channels: data.channels || [] });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          dispatch({
            type: 'LOAD_CHANNELS_ERROR',
            clearSelection: err.response?.status === 403,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    clips.guildId,
    discordConnected,
    disconnectingKey,
    clips.loadingGuilds,
    clips.guildsError,
    guildInList,
    clips.guilds,
  ]);

  return {
    clipsGuildId: clips.guildId,
    clipsChannelId: clips.channelId,
    clipsGuilds: clips.guilds,
    clipsChannels: clips.channels,
    clipsGuildsError: clips.guildsError,
    loadingClipsGuilds: clips.loadingGuilds,
    loadingClipsChannels: clips.loadingChannels,
    syncClipsFromUser: (guildId, channelId) => {
      dispatch({ type: 'SYNC_FROM_USER', guildId, channelId });
    },
    setClipsGuildId: (guildId) => dispatch({ type: 'SET_GUILD_ID', guildId }),
    setClipsChannelId: (channelId) => dispatch({ type: 'SET_CHANNEL_ID', channelId }),
  };
}
