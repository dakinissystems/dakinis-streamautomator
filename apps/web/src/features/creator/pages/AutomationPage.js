/**
 * IF/THEN automation rules for creator workflows.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Zap, ToggleLeft, ToggleRight, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  deleteAutomationRule,
  getAutomationCatalog,
  getAutomationRules,
  seedAutomationDefaults,
  toggleAutomationRule,
} from '../api/creatorApi.js';
import AutomationRuleBuilder from '../components/AutomationRuleBuilder.js';

const TRIGGER_LABELS = {
  'stream.started': 'Directo iniciado',
  'stream.scheduled': 'Contenido programado',
  'stream.ended': 'Directo terminado',
};

export default function AutomationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rules, setRules] = useState([]);
  const [catalog, setCatalog] = useState({ triggers: [], actions: [] });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const actionLabels = useMemo(() => {
    const map = {};
    (catalog.actions || []).forEach((a) => { map[a.type] = a.label || a.type; });
    return map;
  }, [catalog]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [items, cat] = await Promise.all([getAutomationRules(), getAutomationCatalog()]);
      setRules(items);
      setCatalog(cat);
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
    </div>
  );
}
