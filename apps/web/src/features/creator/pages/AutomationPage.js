/**
 * IF/THEN automation rules for creator workflows.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Zap, ToggleLeft, ToggleRight, Plus, Pencil, Trash2, History } from 'lucide-react';
import {
  deleteAutomationRule,
  getAutomationCatalog,
  getAutomationRules,
  getAutomationRuns,
  seedAutomationDefaults,
  toggleAutomationRule,
} from '../api/creatorApi.js';
import AutomationRuleBuilder from '../components/AutomationRuleBuilder.js';

const TRIGGER_LABELS = {
  'stream.started': 'Directo iniciado',
  'stream.scheduled': 'Contenido programado',
  'stream.ended': 'Directo terminado',
};

function formatRunTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function AutomationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rules, setRules] = useState([]);
  const [runs, setRuns] = useState([]);
  const [catalog, setCatalog] = useState({ triggers: [], actions: [] });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState(null);

  const actionLabels = useMemo(() => {
    const map = {};
    (catalog.actions || []).forEach((a) => { map[a.type] = a.label || a.type; });
    return map;
  }, [catalog]);

  const ruleNameById = useMemo(() => {
    const map = {};
    rules.forEach((r) => { map[r.id] = r.name; });
    return map;
  }, [rules]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [items, cat, runItems] = await Promise.all([
        getAutomationRules(),
        getAutomationCatalog(),
        getAutomationRuns({ limit: 30 }),
      ]);
      setRules(items);
      setCatalog(cat);
      setRuns(runItems);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cargar reglas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setCreating(true);
      setEditing(null);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const formatActions = (ruleActions) => {
    if (!Array.isArray(ruleActions) || ruleActions.length === 0) return '—';
    return ruleActions.map((a) => actionLabels[a.type] || a.type).join(' → ');
  };

  const onSeed = async () => {
    try {
      const r = await seedAutomationDefaults();
      toast.success(r.seeded ? 'Reglas por defecto creadas' : 'Ya tienes reglas configuradas');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const onToggle = async (rule) => {
    try {
      await toggleAutomationRule(rule.id, !rule.enabled);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    }
  };

  const onDelete = async (rule) => {
    if (!window.confirm(`¿Eliminar regla «${rule.name}»?`)) return;
    try {
      await deleteAutomationRule(rule.id);
      toast.success('Regla eliminada');
      if (editing?.id === rule.id) setEditing(null);
      if (selectedRuleId === rule.id) setSelectedRuleId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const onSaved = () => {
    toast.success('Regla guardada');
    setCreating(false);
    setEditing(null);
    load();
  };

  const filteredRuns = selectedRuleId
    ? runs.filter((r) => Number(r.ruleId) === Number(selectedRuleId))
    : runs;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Zap className="w-8 h-8 text-accent" />
          Automatización
        </h1>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setCreating(true); setEditing(null); }} className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm border border-accent text-accent">
            <Plus className="w-4 h-4" />
            Nueva regla
          </button>
          <button type="button" onClick={onSeed} className="btn-primary px-4 py-2 rounded-lg text-sm">
            Crear reglas base
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Constructor visual IF/THEN: cuando ocurre un evento del stream, ejecuta acciones en AkoeNet, Discord y la plataforma Dakinis.
      </p>

      {(creating || editing) && (
        <div className="mb-6">
          <AutomationRuleBuilder
            rule={editing}
            onSaved={onSaved}
            onCancel={() => { setCreating(false); setEditing(null); }}
          />
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Cargando…</p>
      ) : rules.length === 0 ? (
        <p className="text-gray-500">Sin reglas. Pulsa &quot;Nueva regla&quot; o &quot;Crear reglas base&quot;.</p>
      ) : (
        <ul className="space-y-3">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{rule.name}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    IF <strong>{TRIGGER_LABELS[rule.triggerType] || rule.triggerType}</strong>
                    {rule.triggerConfig?.platform ? ` · ${rule.triggerConfig.platform}` : ''}
                  </p>
                  <p className="text-xs text-sky-700 dark:text-sky-400 mt-0.5">
                    THEN {formatActions(rule.actions)}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedRuleId((prev) => (prev === rule.id ? null : rule.id))}
                    className={`p-2 ${selectedRuleId === rule.id ? 'text-accent' : 'text-gray-500 hover:text-accent'}`}
                    aria-label="Ver ejecuciones"
                    title="Ver ejecuciones"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => { setEditing(rule); setCreating(false); }} className="p-2 text-gray-500 hover:text-accent" aria-label="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => onDelete(rule)} className="p-2 text-gray-500 hover:text-red-500" aria-label="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => onToggle(rule)} className="text-accent" aria-label="Toggle">
                    {rule.enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 opacity-50" />}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <History className="w-5 h-5 text-accent" />
            Últimas ejecuciones
          </h2>
          {selectedRuleId ? (
            <button
              type="button"
              className="text-xs text-accent hover:underline"
              onClick={() => setSelectedRuleId(null)}
            >
              Ver todas
            </button>
          ) : null}
        </div>
        {filteredRuns.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aún no hay ejecuciones registradas. Se guardan cuando una regla dispara acciones.
          </p>
        ) : (
          <ul className="space-y-2">
            {filteredRuns.map((run) => (
              <li
                key={run.id}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm bg-white/60 dark:bg-gray-800/60"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {ruleNameById[run.ruleId] || `Regla #${run.ruleId}`}
                  </span>
                  <span className={run.status === 'ok' ? 'text-emerald-600' : 'text-red-500'}>
                    {run.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {TRIGGER_LABELS[run.triggerType] || run.triggerType} · {formatRunTime(run.createdAt)}
                  {run.error ? ` · ${run.error}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
