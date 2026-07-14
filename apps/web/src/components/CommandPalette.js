/**
 * StreamAutomator Command Palette (Ctrl+K) — búsqueda federada + navegación.
 */
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, Zap, Radio, Calendar, Package } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { fetchWorkspaceSearchHits } from '../services/workspaceSearch';
import { resolveStreamSearchHitPath } from '../utils/searchHitPaths';

const LOCAL_COMMANDS = [
  { id: 'dashboard', label: 'Ir al Dashboard', path: '/dashboard', group: 'nav', keywords: ['inicio', 'home'] },
  { id: 'schedule', label: 'Calendario / programar', path: '/schedule', group: 'create', keywords: ['calendario', 'stream', 'tweet'] },
  { id: 'director', label: 'Modo Director', path: '/director', group: 'create', keywords: ['live', 'directo', 'obs'] },
  { id: 'automation', label: 'Automatización IF/THEN', path: '/automation', group: 'create', keywords: ['reglas', 'zap', 'discord'] },
  { id: 'campaigns', label: 'Campaign Center', path: '/creator/campaigns', group: 'create', keywords: ['campaña', 'kit', 'launch'] },
  { id: 'analytics', label: 'Analytics creador', path: '/creator/analytics', group: 'nav', keywords: ['estadísticas', 'heatmap'] },
  { id: 'templates', label: 'Plantillas', path: '/templates', group: 'nav', keywords: [] },
  { id: 'media', label: 'Subir media', path: '/media', group: 'nav', keywords: ['upload'] },
  { id: 'timeline', label: 'Timeline de contenido', path: '/stream-timeline', group: 'nav', keywords: ['historial'] },
  { id: 'settings', label: 'Ajustes', path: '/settings', group: 'nav', keywords: ['config'] },
  { id: 'hub', label: 'Abrir Hub Dakinis', href: 'https://dakinissystems.com/hub', group: 'ecosystem', keywords: ['dakinis', 'mi día'] },
  { id: 'core', label: 'Abrir Dakinis One', href: 'https://dakinissystems.com/core', group: 'ecosystem', keywords: ['erp', 'factura'] },
  { id: 'akoenet', label: 'Abrir AkoeNet', href: 'https://akoenet.dakinissystems.com', group: 'ecosystem', keywords: ['discord', 'comunidad'] },
];

const SEARCH_SCOPES = [
  { id: 'all', label: 'Todo' },
  { id: 'events', label: 'Streams' },
  { id: 'messages', label: 'Mensajes' },
  { id: 'customers', label: 'Clientes' },
  { id: 'knowledge', label: 'Ayuda' },
];

const GROUP_LABELS = {
  create: 'Crear',
  nav: 'Navegación',
  ecosystem: 'Ecosistema',
  search: 'Búsqueda',
};

const ICONS = {
  director: Radio,
  automation: Zap,
  campaigns: Package,
  schedule: Calendar,
};

const MIN_SEARCH = 2;
const DEBOUNCE_MS = 280;

const initialSearchState = { hits: [], loading: false };

function searchReducer(state, action) {
  switch (action.type) {
    case 'idle':
      return initialSearchState;
    case 'loading':
      return { ...state, loading: true };
    case 'done':
      return { hits: action.hits, loading: false };
    default:
      return state;
  }
}

function filterCommands(query) {
  const q = query.trim().toLowerCase();
  if (!q) return LOCAL_COMMANDS;
  return LOCAL_COMMANDS.filter((cmd) => {
    const hay = [cmd.label, cmd.group, ...(cmd.keywords || [])].join(' ').toLowerCase();
    return hay.includes(q);
  });
}

function scopeLabel(scope) {
  const match = SEARCH_SCOPES.find((s) => s.id === scope);
  if (match) return match.label;
  if (scope === 'events' || scope === 'streams') return 'Streams';
  if (scope === 'clients' || scope === 'customers') return 'Clientes';
  return 'Resultado';
}

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const searchSeq = useRef(0);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchState, dispatchSearch] = useReducer(searchReducer, initialSearchState);

  const commands = useMemo(() => filterCommands(query), [query]);
  const trimmed = query.trim();
  const canFetchSearch = trimmed.length >= MIN_SEARCH;

  useEffect(() => {
    if (!canFetchSearch) {
      dispatchSearch({ type: 'idle' });
      return undefined;
    }

    const seq = ++searchSeq.current;
    const controller = new AbortController();
    dispatchSearch({ type: 'loading' });

    const timer = setTimeout(() => {
      fetchWorkspaceSearchHits(trimmed, scope, { signal: controller.signal })
        .then((hits) => {
          if (seq !== searchSeq.current) return;
          dispatchSearch({ type: 'done', hits: Array.isArray(hits) ? hits : [] });
        })
        .catch(() => {
          if (seq !== searchSeq.current) return;
          dispatchSearch({ type: 'done', hits: [] });
        });
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [canFetchSearch, trimmed, scope]);

  const listItems = useMemo(() => {
    const searchRows = canFetchSearch
      ? searchState.hits.map((hit) => ({
          kind: 'search',
          id: `search:${hit.scope}:${hit.id}`,
          hit,
          label: hit.title || hit.id,
          snippet: hit.snippet || '',
          group: 'search',
        }))
      : [];
    const cmdRows = commands.map((cmd) => ({
      kind: 'command',
      id: cmd.id,
      cmd,
      label: cmd.label,
      snippet: '',
      group: cmd.group,
    }));
    return [...searchRows, ...cmdRows];
  }, [canFetchSearch, searchState.hits, commands]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setScope('all');
      setActiveIndex(0);
      dispatchSearch({ type: 'idle' });
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, scope, listItems.length]);

  const runCommand = useCallback(
    (cmd) => {
      onClose();
      if (cmd.href) {
        window.open(cmd.href, '_blank', 'noopener,noreferrer');
        return;
      }
      if (cmd.path) navigate(cmd.path);
    },
    [navigate, onClose],
  );

  const runSearchHit = useCallback(
    (hit) => {
      onClose();
      const dest = resolveStreamSearchHitPath(hit);
      if (!dest) return;
      if (dest.external && dest.href) {
        window.open(dest.href, '_blank', 'noopener,noreferrer');
        return;
      }
      if (dest.path) navigate(dest.path);
    },
    [navigate, onClose],
  );

  const activate = useCallback(
    (item) => {
      if (!item) return;
      if (item.kind === 'search') runSearchHit(item.hit);
      else runCommand(item.cmd);
    },
    [runCommand, runSearchHit],
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, listItems.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' && listItems[activeIndex]) {
        e.preventDefault();
        activate(listItems[activeIndex]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, listItems, activeIndex, onClose, activate]);

  if (!open) return null;

  const showEmpty = listItems.length === 0 && !searchState.loading;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={t('common.commandPalette') || 'Paleta de comandos'}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar publicaciones, páginas o ecosistema Dakinis…"
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          <kbd className="hidden sm:inline text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500">Esc</kbd>
        </div>
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          {SEARCH_SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`text-xs px-2 py-0.5 rounded-full border ${
                scope === s.id
                  ? 'border-accent text-accent bg-accent/10'
                  : 'border-gray-300 dark:border-gray-600 text-gray-500'
              }`}
              onClick={() => setScope(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <ul className="max-h-80 overflow-y-auto py-1">
          {searchState.loading ? (
            <li className="px-4 py-6 text-center text-sm text-gray-500">Buscando…</li>
          ) : showEmpty ? (
            <li className="px-4 py-6 text-center text-sm text-gray-500">Sin resultados</li>
          ) : (
            listItems.map((item, index) => {
              const Icon = item.kind === 'command' ? ICONS[item.id] || Command : Search;
              const badge =
                item.kind === 'search' ? scopeLabel(item.hit?.scope) : GROUP_LABELS[item.group] || item.group;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => activate(item)}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 ${
                      index === activeIndex
                        ? 'bg-accent/10 text-accent'
                        : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 opacity-60 flex-shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{item.label}</span>
                      {item.snippet ? (
                        <span className="block text-xs opacity-60 truncate">{item.snippet}</span>
                      ) : null}
                    </span>
                    <span className="text-xs opacity-50 flex-shrink-0">{badge}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <p className="px-4 py-2 text-xs text-gray-400 border-t border-gray-200 dark:border-gray-700">
          ↑↓ navegar · Enter abrir · Ctrl+K · búsqueda federada Hub/Core/AkoeNet
        </p>
      </div>
    </div>
  );
}

export function useCommandPaletteShortcut(onOpen) {
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpen]);
}
