/**
 * StreamAutomator Command Palette (Ctrl+K) — navegación y acciones rápidas.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const COMMANDS = [
  { id: 'dashboard', label: 'Ir al Dashboard', path: '/dashboard', keywords: ['inicio', 'home'] },
  { id: 'schedule', label: 'Calendario / programar', path: '/schedule', keywords: ['calendario', 'stream'] },
  { id: 'director', label: 'Modo Director', path: '/director', keywords: ['live', 'directo'] },
  { id: 'automation', label: 'Automatización IF/THEN', path: '/automation', keywords: ['reglas', 'zap'] },
  { id: 'analytics', label: 'Analytics creador', path: '/creator/analytics', keywords: ['estadísticas'] },
  { id: 'campaigns', label: 'Campaign kits', path: '/creator/campaign-kits', keywords: ['campaña'] },
  { id: 'templates', label: 'Plantillas', path: '/templates', keywords: [] },
  { id: 'media', label: 'Subir media', path: '/media', keywords: ['upload'] },
  { id: 'settings', label: 'Ajustes', path: '/settings', keywords: ['config'] },
  { id: 'profile', label: 'Perfil', path: '/profile', keywords: [] },
  { id: 'bits', label: 'Twitch Bits', path: '/bits', keywords: ['twitch'] },
  { id: 'hub', label: 'Abrir Hub Dakinis', href: 'https://hub.dakinissystems.com', keywords: ['dakinis'] },
];

function filterCommands(query) {
  const q = query.trim().toLowerCase();
  if (!q) return COMMANDS;
  return COMMANDS.filter((cmd) => {
    const hay = [cmd.label, ...(cmd.keywords || [])].join(' ').toLowerCase();
    return hay.includes(q);
  });
}

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => filterCommands(query), [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

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
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' && results[activeIndex]) {
        e.preventDefault();
        runCommand(results[activeIndex]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, results, activeIndex, onClose, runCommand]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
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
            placeholder="Buscar página o acción…"
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
          <kbd className="hidden sm:inline text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500">Esc</kbd>
        </div>
        <ul className="max-h-72 overflow-y-auto py-1">
          {results.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-gray-500">Sin resultados</li>
          ) : (
            results.map((cmd, index) => (
              <li key={cmd.id}>
                <button
                  type="button"
                  onClick={() => runCommand(cmd)}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 ${
                    index === activeIndex
                      ? 'bg-accent/10 text-accent'
                      : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Command className="w-4 h-4 opacity-60" />
                  {cmd.label}
                </button>
              </li>
            ))
          )}
        </ul>
        <p className="px-4 py-2 text-xs text-gray-400 border-t border-gray-200 dark:border-gray-700">
          ↑↓ navegar · Enter abrir · Ctrl+K en cualquier momento
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
