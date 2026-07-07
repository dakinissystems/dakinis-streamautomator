import { useReducer, useEffect } from 'react';
import { getAkoenetGuilds, getAkoenetChannels } from '../../../features/akoenet/api';
import { devCatchLog } from '../../../utils/devCatchLog';
import { mapAkoenetGuildsLoadError } from './mapAkoenetGuildsLoadError';

const initialDiscoveryState = {
  guilds: [],
  channels: [],
  error: null,
  manualTargets: false,
  loadingGuilds: false,
  loadingChannels: false,
};

function akoenetDiscoveryReducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return { ...initialDiscoveryState };
    case 'LOAD_GUILDS_START':
      return {
        ...state,
        loadingGuilds: true,
        error: null,
        manualTargets: false,
      };
    case 'LOAD_GUILDS_SUCCESS':
      return {
        ...state,
        guilds: action.guilds,
        error: null,
        loadingGuilds: false,
      };
    case 'LOAD_GUILDS_MANUAL':
      return {
        ...state,
        guilds: [],
        error: null,
        manualTargets: true,
        loadingGuilds: false,
      };
    case 'LOAD_GUILDS_ERROR':
      return {
        ...state,
        guilds: [],
        error: action.error,
        manualTargets: false,
        loadingGuilds: false,
      };
    case 'RESET_CHANNELS':
      return {
        ...state,
        channels: [],
        loadingChannels: false,
      };
    case 'LOAD_CHANNELS_START':
      return {
        ...state,
        loadingChannels: true,
      };
    case 'LOAD_CHANNELS_SUCCESS':
      return {
        ...state,
        channels: action.channels,
        loadingChannels: false,
      };
    case 'LOAD_CHANNELS_ERROR':
      return {
        ...state,
        channels: [],
        loadingChannels: false,
      };
    default:
      return state;
  }
}

export function useAkoenetDiscovery({
  token,
  akoenetConfigured,
  streamMode,
  user,
  akoenetServerId,
  t,
}) {
  const [discovery, dispatch] = useReducer(akoenetDiscoveryReducer, initialDiscoveryState);

  useEffect(() => {
    if (!token || !akoenetConfigured || streamMode) {
      dispatch({ type: 'RESET' });
      return;
    }
    let cancelled = false;
    dispatch({ type: 'LOAD_GUILDS_START' });
    getAkoenetGuilds()
      .then((data) => {
        if (!cancelled) {
          dispatch({ type: 'LOAD_GUILDS_SUCCESS', guilds: data.guilds || [] });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const code = err.response?.data?.code;
          if (code === 'akoenet_discovery_not_implemented') {
            dispatch({ type: 'LOAD_GUILDS_MANUAL' });
          } else {
            dispatch({
              type: 'LOAD_GUILDS_ERROR',
              error: mapAkoenetGuildsLoadError(err, t),
            });
          }
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, akoenetConfigured, streamMode, user?.id, user?.akoenetWebhookUrl, t]);

  const guildInList = discovery.guilds.some((g) => g.id === akoenetServerId);

  useEffect(() => {
    if (!akoenetServerId || !akoenetConfigured || streamMode || discovery.manualTargets) {
      dispatch({ type: 'RESET_CHANNELS' });
      return;
    }
    if (discovery.loadingGuilds || discovery.error) return;
    if (!guildInList) {
      dispatch({ type: 'RESET_CHANNELS' });
      return;
    }
    let cancelled = false;
    dispatch({ type: 'LOAD_CHANNELS_START' });
    getAkoenetChannels(akoenetServerId)
      .then((data) => {
        if (!cancelled) {
          dispatch({ type: 'LOAD_CHANNELS_SUCCESS', channels: data.channels || [] });
        }
      })
      .catch((e) => {
        devCatchLog('SettingsBotsTab.getAkoenetChannels', e);
        if (!cancelled) dispatch({ type: 'LOAD_CHANNELS_ERROR' });
      });
    return () => {
      cancelled = true;
    };
  }, [
    akoenetServerId,
    akoenetConfigured,
    streamMode,
    discovery.manualTargets,
    discovery.loadingGuilds,
    discovery.error,
    guildInList,
    discovery.guilds,
  ]);

  return {
    akoenetGuilds: discovery.guilds,
    akoenetChannels: discovery.channels,
    akoenetGuildsError: discovery.error,
    akoenetManualTargets: discovery.manualTargets,
    loadingAkoenetGuilds: discovery.loadingGuilds,
    loadingAkoenetChannels: discovery.loadingChannels,
    guildInList,
  };
}
