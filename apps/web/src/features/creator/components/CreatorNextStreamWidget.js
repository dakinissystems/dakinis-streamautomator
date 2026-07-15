/**
 * Hub-style next stream widget from workspace API.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Rocket } from 'lucide-react';
import { getDirectorActive, getWorkspaceWidgets, startDirector } from '../api/creatorApi.js';
import toast from 'react-hot-toast';

function formatWhen(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function CreatorNextStreamWidget() {
  const [payload, setPayload] = useState(null);
  const [directorActive, setDirectorActive] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [widgets, director] = await Promise.all([
        getWorkspaceWidgets(),
        getDirectorActive(),
      ]);
      setPayload(widgets);
      setDirectorActive(Boolean(director?.active));
    } catch {
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const next = payload?.nextStream || payload?.widgets?.['streamautomator.next-stream'];
  const obs = payload?.widgets?.['streamautomator.obs-status'];
  const quickActions = payload?.quickActions || [];

  const onStartDirector = async () => {
    try {
      await startDirector({});
      toast.success('Director iniciado');
      window.location.href = '/director';
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al iniciar');
    }
  };

  if (loading) return null;

  return (
    <div className="mb-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Radio className="w-4 h-4 text-red-500" />
          Próximo directo
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${directorActive || obs?.live ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
          {directorActive || obs?.live ? 'EN DIRECTO' : obs?.label || 'Offline'}
        </span>
      </div>

      {next ? (
        <>
          <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{next.title}</p>
          <p className="text-xs text-gray-500 mt-1">{formatWhen(next.startsAt || next.scheduledFor)} · {next.platform || 'twitch'}</p>
        </>
      ) : (
        <p className="text-sm text-gray-500">Sin streams programados</p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {quickActions.map((action) => (
          <Link
            key={action.id}
            to={action.path}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {action.label}
          </Link>
        ))}
        {!directorActive && (
          <button type="button" onClick={onStartDirector} className="text-xs px-2.5 py-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-700 inline-flex items-center gap-1">
            <Rocket className="w-3.5 h-3.5" />
            Iniciar Director
          </button>
        )}
      </div>
    </div>
  );
}
