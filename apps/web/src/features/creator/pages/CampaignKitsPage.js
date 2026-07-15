/**
 * Campaign kits — preview timeline and apply multi-post launch templates.
 */
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Calendar, Eye, Package } from 'lucide-react';
import { applyCampaignKit, getCampaignKits, previewCampaignKit } from '../api/creatorApi.js';

function formatWhen(iso) {
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

function KitPreviewTimeline({ preview }) {
  if (!preview?.items?.length) return null;
  return (
    <ol className="mt-3 space-y-2 border-l-2 border-emerald-300 dark:border-emerald-700 pl-4">
      {preview.items.map((item, index) => (
        <li key={`${item.scheduledFor}-${index}`} className="relative text-sm">
          <span className="absolute -left-[1.35rem] top-1.5 w-2 h-2 rounded-full bg-emerald-500" />
          <p className="font-medium text-gray-800 dark:text-gray-200">{item.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatWhen(item.scheduledFor)} · {item.contentType} · {item.platforms?.join(', ')}
            {item.offsetDays !== 0 && (
              <span className="ml-1 text-gray-400">
                ({item.offsetDays > 0 ? '+' : ''}{item.offsetDays}d)
              </span>
            )}
          </p>
        </li>
      ))}
    </ol>
  );
}

export default function CampaignKitsPage() {
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState('');
  const [launchDate, setLaunchDate] = useState('');
  const [applying, setApplying] = useState(null);
  const [previewing, setPreviewing] = useState(null);
  const [previews, setPreviews] = useState({});

  const kitParams = {
    game: game.trim() || undefined,
    launchDate: launchDate || undefined,
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setKits(await getCampaignKits());
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cargar kits');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onPreview = async (kitId) => {
    setPreviewing(kitId);
    try {
      const data = await previewCampaignKit(kitId, kitParams);
      setPreviews((prev) => ({ ...prev, [kitId]: data }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al previsualizar');
    } finally {
      setPreviewing(null);
    }
  };

  const onApply = async (kitId) => {
    setApplying(kitId);
    try {
      const result = await applyCampaignKit(kitId, kitParams);
      toast.success(`Kit aplicado — ${result.created?.length ?? 0} entradas creadas`);
      setPreviews((prev) => {
        const next = { ...prev };
        delete next[kitId];
        return next;
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al aplicar kit');
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
        <Package className="w-8 h-8 text-accent" />
        Kits de campaña
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Previsualiza la línea temporal antes de crear las entradas en el calendario.
      </p>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <label className="block text-sm">
          <span className="text-gray-600 dark:text-gray-400">Juego / tema</span>
          <input
            type="text"
            value={game}
            onChange={(e) => {
              setGame(e.target.value);
              setPreviews({});
            }}
            placeholder="Elden Ring"
            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600 dark:text-gray-400">Fecha launch</span>
          <input
            type="datetime-local"
            value={launchDate}
            onChange={(e) => {
              setLaunchDate(e.target.value);
              setPreviews({});
            }}
            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
          />
        </label>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando…</p>
      ) : (
        <ul className="space-y-3">
          {kits.map((kit) => {
            const preview = previews[kit.id];
            const expanded = Boolean(preview);
            return (
              <li
                key={kit.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{kit.name}</p>
                    <p className="text-sm text-gray-500">{kit.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{kit.itemCount} entradas en calendario</p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={previewing === kit.id}
                      onClick={() => (expanded ? setPreviews((p) => { const n = { ...p }; delete n[kit.id]; return n; }) : onPreview(kit.id))}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      <Eye className="w-4 h-4" />
                      {previewing === kit.id ? 'Cargando…' : expanded ? 'Ocultar' : 'Vista previa'}
                    </button>
                    <button
                      type="button"
                      disabled={applying === kit.id}
                      onClick={() => onApply(kit.id)}
                      className="btn-primary px-4 py-2 rounded-lg text-sm whitespace-nowrap disabled:opacity-50"
                    >
                      {applying === kit.id ? 'Aplicando…' : 'Aplicar kit'}
                    </button>
                  </div>
                </div>
                {expanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Launch: {formatWhen(preview.launchDate)} · {preview.game}
                    </p>
                    <KitPreviewTimeline preview={preview} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
