/**
 * Smart schedule suggestions based on heatmap / prime slots.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar, Sparkles } from 'lucide-react';
import { getSchedulerSuggestions } from '../api/creatorApi.js';

function formatSlot(iso) {
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

export default function CreatorSmartSchedule({ compact = false }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getSchedulerSuggestions(14));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onUseSlot = (slot) => {
    navigate('/schedule', {
      state: {
        prefilled: {
          title: slot.title,
          contentType: slot.contentType || 'stream',
          platforms: [slot.platform || 'twitch'],
          scheduledFor: slot.scheduledFor,
        },
      },
    });
    toast.success('Horario cargado en el formulario');
  };

  if (loading) {
    return compact ? null : <p className="text-sm text-gray-500">Cargando sugerencias…</p>;
  }

  const suggestions = data?.suggestions || [];
  if (!suggestions.length) return null;

  return (
    <div className={`rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/20 ${compact ? 'p-3' : 'p-4 mb-6'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${compact ? 'text-sm' : ''}`}>
          Smart Scheduler
        </h3>
        <span className="text-[10px] uppercase tracking-wide text-violet-600 dark:text-violet-400">
          {data.source === 'heatmap' ? 'tu actividad' : 'horarios prime'}
        </span>
      </div>
      <ul className={`space-y-2 ${compact ? 'text-xs' : 'text-sm'}`}>
        {suggestions.map((slot) => (
          <li
            key={slot.scheduledFor}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/80 dark:bg-gray-900/40 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="font-medium text-gray-800 dark:text-gray-200">{formatSlot(slot.scheduledFor)}</p>
              <p className="text-gray-500 dark:text-gray-400 truncate">{slot.reason}</p>
            </div>
            <button
              type="button"
              onClick={() => onUseSlot(slot)}
              className="shrink-0 px-2.5 py-1 rounded bg-violet-600 text-white text-xs hover:bg-violet-700"
            >
              Usar
            </button>
          </li>
        ))}
      </ul>
      {!compact && (
        <Link to="/schedule" className="inline-flex items-center gap-1 mt-3 text-xs text-violet-700 dark:text-violet-300 hover:underline">
          <Calendar className="w-3.5 h-3.5" />
          Abrir calendario completo
        </Link>
      )}
    </div>
  );
}
