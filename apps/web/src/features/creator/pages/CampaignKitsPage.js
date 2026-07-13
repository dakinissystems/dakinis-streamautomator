/**
 * Campaign kits — apply multi-post launch templates to the calendar.
 */
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Package } from 'lucide-react';
import { applyCampaignKit, getCampaignKits } from '../api/creatorApi.js';

export default function CampaignKitsPage() {
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState('');
  const [launchDate, setLaunchDate] = useState('');
  const [applying, setApplying] = useState(null);

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

  const onApply = async (kitId) => {
    setApplying(kitId);
    try {
      const result = await applyCampaignKit(kitId, {
        game: game.trim() || undefined,
        launchDate: launchDate || undefined,
      });
      toast.success(`Kit aplicado — ${result.created?.length ?? 0} entradas creadas`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al aplicar kit');
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-6">
        <Package className="w-8 h-8 text-accent" />
        Kits de campaña
      </h1>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <label className="block text-sm">
          <span className="text-gray-600 dark:text-gray-400">Juego / tema</span>
          <input
            type="text"
            value={game}
            onChange={(e) => setGame(e.target.value)}
            placeholder="Elden Ring"
            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600 dark:text-gray-400">Fecha launch</span>
          <input
            type="datetime-local"
            value={launchDate}
            onChange={(e) => setLaunchDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
          />
        </label>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando…</p>
      ) : (
        <ul className="space-y-3">
          {kits.map((kit) => (
            <li
              key={kit.id}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium">{kit.name}</p>
                <p className="text-sm text-gray-500">{kit.description}</p>
                <p className="text-xs text-gray-400 mt-1">{kit.itemCount} entradas en calendario</p>
              </div>
              <button
                type="button"
                disabled={applying === kit.id}
                onClick={() => onApply(kit.id)}
                className="btn-primary px-4 py-2 rounded-lg text-sm whitespace-nowrap disabled:opacity-50"
              >
                {applying === kit.id ? 'Aplicando…' : 'Aplicar kit'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
