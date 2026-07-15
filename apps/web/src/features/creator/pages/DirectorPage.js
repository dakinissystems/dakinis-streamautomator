/**
 * Director mode — mission control checklist during a live stream.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Rocket,
  CheckCircle2,
  Circle,
  Loader2,
  ExternalLink,
  Copy,
  Clipboard,
} from 'lucide-react';
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

function runHint(hint) {
  if (!hint) return;
  if (hint.type === 'copy' && hint.text) {
    navigator.clipboard.writeText(hint.text).then(
      () => toast.success('Copiado al portapapeles'),
      () => toast.error('No se pudo copiar'),
    );
    return;
  }
  if (hint.type === 'open' && hint.url) {
    window.open(hint.url, '_blank', 'noopener,noreferrer');
    return;
  }
  if (hint.type === 'route' && hint.path) {
    window.location.href = hint.path;
  }
}

function HintButton({ hint }) {
  if (hint.type === 'info') {
    return <span className="text-xs text-gray-500 italic">{hint.label}</span>;
  }
  const Icon = hint.type === 'copy' ? Copy : hint.type === 'route' ? Clipboard : ExternalLink;
  return (
    <button
      type="button"
      onClick={() => runHint(hint)}
      className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 inline-flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-700"
    >
      <Icon className="w-3 h-3" />
      {hint.label}
    </button>
  );
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

  useEffect(() => {
    try {
      localStorage.setItem('sa_director_tried', '1');
    } catch {
      /* ignore */
    }
  }, []);

  const onStart = async () => {
    try {
      await startDirector({});
      toast.success('Sesión Director iniciada');
      load();
    } catch (err) {
      const details = err.response?.data?.details;
      const message = err.response?.data?.error || 'Error al iniciar';
      toast.error(details ? `${message}: ${details}` : message);
    }
  };

  const onCompleteStep = async (stepId) => {
    const session = summary.session;
    if (!session?.id) return;
    try {
      const result = await completeDirectorStep(session.id, stepId);
      const effects = result?.lastStepEffects || [];
      const failed = effects.find((e) => e.error);
      if (failed) {
        toast.error(`Paso completado, pero: ${failed.error}`);
      } else if (effects.some((e) => e.ok)) {
        toast.success('Paso completado y acciones ejecutadas');
      } else {
        toast.success('Paso completado');
      }
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
  const activeHints = session?.activeStep?.hints || [];

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

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Asistente activo durante la transmisión. Cada paso tiene acciones rápidas; al marcar <strong>Hecho</strong> se ejecutan efectos (Discord, Assistant…).
      </p>

      {summary.active && (
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <Link to="/schedule" className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
            Calendario
          </Link>
          <Link to="/automation" className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
            Automatización
          </Link>
          <Link to="/media" className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
            Media
          </Link>
        </div>
      )}

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

          {activeHints.length > 0 && (
            <div className="mb-4 p-3 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30">
              <p className="text-xs font-semibold text-sky-800 dark:text-sky-300 mb-2">Acciones del paso actual</p>
              <div className="flex flex-wrap gap-2">
                {activeHints.map((hint, i) => (
                  <HintButton key={`${hint.type}-${i}`} hint={hint} />
                ))}
              </div>
            </div>
          )}

          <ul className="space-y-2 text-sm">
            {steps.map((step) => (
              <li
                key={step.id}
                className={`p-3 rounded-lg border ${
                  step.status === 'active'
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {stepStatusIcon(step.status)}
                  <div className="flex-1 min-w-0">
                    <span className="font-mono">{step.label}</span>
                    {step.dueAt && step.status === 'active' ? (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Sugerido antes de {new Date(step.dueAt).toLocaleTimeString()}
                      </p>
                    ) : null}
                  </div>
                  {step.status === 'active' ? (
                    <button
                      type="button"
                      onClick={() => onCompleteStep(step.id)}
                      className="text-xs px-3 py-1.5 rounded bg-sky-600 text-white font-medium"
                    >
                      Hecho
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
