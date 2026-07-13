/**
 * Director mode — mission control checklist during a live stream.
 */
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Rocket, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import {
  completeDirectorStep,
  endDirectorSession,
  getDirectorActive,
  startDirector,
} from '../api/creatorApi.js';

function stepStatusIcon(status) {
  if (status === 'done') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  if (status === 'active') return <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />;
  return <Circle className="w-5 h-5 text-gray-400" />;
}

export default function DirectorPage() {
  const [summary, setSummary] = useState({ active: false, session: null });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSummary(await getDirectorActive());
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo cargar Director');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onStart = async () => {
    try {
      await startDirector({});
      toast.success('Sesión Director iniciada');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al iniciar');
    }
  };

  const onCompleteStep = async (stepId) => {
    const session = summary.session;
    if (!session?.id) return;
    try {
      await completeDirectorStep(session.id, stepId);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al completar paso');
    }
  };

  const onEnd = async () => {
    const session = summary.session;
    if (!session?.id) return;
    try {
      await endDirectorSession(session.id);
      toast.success('Directo finalizado');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al finalizar');
    }
  };

  const session = summary.session;
  const steps = session?.steps || [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Rocket className="w-8 h-8 text-accent" />
          Modo Director
        </h1>
        {!summary.active ? (
          <button type="button" onClick={onStart} className="btn-primary px-4 py-2 rounded-lg text-sm">
            Iniciar sesión
          </button>
        ) : (
          <button type="button" onClick={onEnd} className="px-4 py-2 rounded-lg text-sm border border-red-400 text-red-600">
            Finalizar directo
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Guía paso a paso durante la transmisión. Se activa automáticamente con{' '}
        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">POST /webhooks/stream/start</code>.
      </p>

      {loading ? (
        <p className="text-gray-500">Cargando…</p>
      ) : !summary.active ? (
        <p className="text-gray-500">No hay sesión activa. Inicia una manualmente o conecta Streamer.bot al webhook.</p>
      ) : (
        <>
          <div className="mb-4 p-4 rounded-xl bg-gray-900 text-white">
            <p className="text-xs uppercase tracking-wide text-gray-400">En directo</p>
            <p className="text-lg font-semibold">{session.title}</p>
            <p className="text-sm text-gray-300 mt-1">
              {session.progress?.done}/{session.progress?.total} pasos · {session.platform}
            </p>
          </div>
          <ul className="space-y-2 font-mono text-sm">
            {steps.map((step) => (
              <li
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  step.status === 'active'
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                {stepStatusIcon(step.status)}
                <span className="flex-1">{step.label}</span>
                {step.status === 'active' ? (
                  <button
                    type="button"
                    onClick={() => onCompleteStep(step.id)}
                    className="text-xs px-2 py-1 rounded bg-sky-600 text-white"
                  >
                    Hecho
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
