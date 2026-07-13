/**
 * Creator analytics — timeline heatmap + publication metrics.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCreatorAnalytics } from '../api/creatorApi.js';

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function HeatmapGrid({ heatmap }) {
  if (!heatmap?.length) return null;
  const max = Math.max(1, ...heatmap.flat());

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: 'auto repeat(24, 1fr)' }}>
        <div />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className="text-[10px] text-gray-400 text-center w-4">
            {h % 6 === 0 ? h : ''}
          </div>
        ))}
        {heatmap.map((row, day) => (
          <React.Fragment key={day}>
            <div className="text-xs text-gray-500 pr-2 flex items-center">{DAY_LABELS[day]}</div>
            {row.map((count, hour) => {
              const intensity = count / max;
              return (
                <div
                  key={`${day}-${hour}`}
                  title={`${DAY_LABELS[day]} ${hour}:00 — ${count} eventos`}
                  className="w-4 h-4 rounded-sm"
                  style={{
                    backgroundColor: count
                      ? `rgba(14, 165, 233, ${0.15 + intensity * 0.85})`
                      : 'rgba(148, 163, 184, 0.15)',
                  }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default function CreatorAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getCreatorAnalytics(days));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cargar analytics');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const pubs = data?.publications;
  const heat = data?.heatmap;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-accent" />
          Analytics
        </h1>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
        >
          <option value={30}>30 días</option>
          <option value={90}>90 días</option>
          <option value={180}>180 días</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando…</p>
      ) : (
        <div className="space-y-6">
          <section className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="font-semibold mb-3">Publicaciones por plataforma</h2>
            {pubs?.byPlatform?.length ? (
              <ul className="space-y-2">
                {pubs.byPlatform.map((row) => (
                  <li key={row.platform} className="flex justify-between text-sm gap-4">
                    <span className="capitalize">{row.platform}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {row.success}/{row.total} OK ({row.successRate}%)
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Sin métricas de publicación en este periodo.</p>
            )}
          </section>

          <section className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h2 className="font-semibold mb-1">Heatmap de actividad (timeline)</h2>
            <p className="text-xs text-gray-500 mb-4">
              {heat?.totalEvents ?? 0} eventos en {heat?.days ?? days} días
            </p>
            <HeatmapGrid heatmap={heat?.heatmap} />
            {heat?.byType && Object.keys(heat.byType).length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2 text-xs">
                {Object.entries(heat.byType).map(([type, count]) => (
                  <li key={type} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">
                    {type}: {count}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
