/**
 * Creator Suite summary card for the dashboard.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Rocket, Zap, BarChart3, CheckCircle2, AlertCircle, Calendar, Package } from 'lucide-react';
import {
  getCalendarReadiness,
  getDirectorActive,
  startDirector,
} from '../api/creatorApi.js';
import CreatorSmartSchedule from './CreatorSmartSchedule.js';

export default function CreatorSuiteCard() {
  const navigate = useNavigate();
  const [readiness, setReadiness] = useState(null);
  const [director, setDirector] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, d] = await Promise.all([getCalendarReadiness(3), getDirectorActive()]);
      setReadiness(r);
      setDirector(d);
    } catch {
      setReadiness(null);
      setDirector(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onQuickStartDirector = async () => {
    try {
      await startDirector({});
      toast.success('Director iniciado');
      navigate('/director');
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo iniciar Director');
    }
  };

  const nextItem = readiness?.items?.[0];
  const readyCount = readiness?.summary?.ready ?? 0;
  const totalCount = readiness?.summary?.total ?? 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 sm:p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Creator Suite</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link to="/director" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50">
            <Rocket className="w-4 h-4" />
            Director
          </Link>
          <Link to="/automation" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50">
            <Zap className="w-4 h-4" />
            Automatización
          </Link>
          <Link to="/creator/analytics" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
          <Link to="/creator/campaigns" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50">
            <Package className="w-4 h-4" />
            Campaigns
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4 text-sm mb-4">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3">
              <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">Próximo stream</p>
              {nextItem ? (
                <>
                  <p className="text-gray-700 dark:text-gray-300 truncate">{nextItem.title}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    {nextItem.ready ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Listo ({nextItem.readinessScore}%)
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        Pendiente ({nextItem.readinessScore}%)
                      </>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-gray-500">Sin streams programados</p>
              )}
              {totalCount > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {readyCount}/{totalCount} streams listos
                </p>
              )}
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3">
              <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">Modo Director</p>
              {director?.active ? (
                <>
                  <p className="text-emerald-600 dark:text-emerald-400 font-medium">En directo</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    Paso: {director.session?.activeStep?.label || '—'}
                  </p>
                </>
              ) : (
                <p className="text-gray-500">Offline</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 w-full mb-1">Acciones rápidas</span>
            {!director?.active ? (
              <button type="button" onClick={onQuickStartDirector} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-sky-600 text-white hover:bg-sky-700">
                <Rocket className="w-3.5 h-3.5" />
                Iniciar Director
              </button>
            ) : (
              <Link to="/director" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-sky-600 text-white hover:bg-sky-700">
                <Rocket className="w-3.5 h-3.5" />
                Abrir Director
              </Link>
            )}
            <Link to="/schedule" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
              <Calendar className="w-3.5 h-3.5" />
              Calendario
            </Link>
            <Link to="/creator/campaigns" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
              <Package className="w-3.5 h-3.5" />
              Nueva campaña
            </Link>
          </div>

          <div className="mt-4">
            <CreatorSmartSchedule compact />
          </div>
        </>
      )}
    </div>
  );
}
