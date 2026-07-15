/**
 * Visual IF/THEN automation rule builder — flujo tipo n8n sin dependencias extra.
 */
import React, { useEffect, useState } from 'react';
import { ArrowDown, Plus, Trash2, X, Zap } from 'lucide-react';
import {
  createAutomationRule,
  getAutomationCatalog,
  updateAutomationRule,
} from '../api/creatorApi.js';

const EMPTY_ACTION = { type: 'platform.notification', params: { title: 'StreamAutomator', body: '' } };

const TRIGGER_COLORS = {
  'stream.started': 'from-rose-500/20 to-orange-500/10 border-rose-400/40',
  'stream.scheduled': 'from-sky-500/20 to-blue-500/10 border-sky-400/40',
  'stream.ended': 'from-violet-500/20 to-purple-500/10 border-violet-400/40',
};

function FlowConnector() {
  return (
    <div className="flex flex-col items-center py-1" aria-hidden>
      <div className="w-0.5 h-4 bg-gradient-to-b from-gray-300 to-accent/60 dark:from-gray-600" />
      <ArrowDown className="w-4 h-4 text-accent/70" />
      <div className="w-0.5 h-4 bg-gradient-to-b from-accent/60 to-gray-300 dark:to-gray-600" />
    </div>
  );
}

export default function AutomationRuleBuilder({ rule, onSaved, onCancel }) {
  const [catalog, setCatalog] = useState({ triggers: [], actions: [] });
  const [name, setName] = useState(rule?.name || '');
  const [triggerType, setTriggerType] = useState(rule?.triggerType || 'stream.started');
  const [platform, setPlatform] = useState(rule?.triggerConfig?.platform || '');
  const [actions, setActions] = useState(
    Array.isArray(rule?.actions) && rule.actions.length > 0 ? rule.actions : [{ ...EMPTY_ACTION }],
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAutomationCatalog()
      .then(setCatalog)
      .catch(() => setCatalog({ triggers: [], actions: [] }));
  }, []);

  const actionMeta = (type) => catalog.actions?.find((a) => a.type === type);
  const triggerMeta = catalog.triggers?.find((t) => (t.id || t) === triggerType);
  const triggerGradient = TRIGGER_COLORS[triggerType] || 'from-amber-500/20 to-yellow-500/10 border-amber-400/40';

  const updateAction = (index, patch) => {
    setActions((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  };

  const updateActionParam = (index, key, value) => {
    setActions((prev) =>
      prev.map((a, i) =>
        i === index ? { ...a, params: { ...(a.params || {}), [key]: value } } : a,
      ),
    );
  };

  const addAction = () => {
    const first = catalog.actions?.[0]?.type || 'platform.notification';
    setActions((prev) => [...prev, { type: first, params: {} }]);
  };

  const removeAction = (index) => {
    setActions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: name.trim() || 'Nueva regla',
        triggerType,
        triggerConfig: platform.trim() ? { platform: platform.trim() } : null,
        actions: actions.filter((a) => a.type),
        enabled: rule?.enabled !== false,
      };
      const saved = rule?.id
        ? await updateAutomationRule(rule.id, body)
        : await createAutomationRule(body);
      onSaved?.(saved);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-accent" />
          {rule?.id ? 'Editar automatización' : 'Nueva automatización visual'}
        </h2>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="p-1 text-gray-500 hover:text-gray-700" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de la regla</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          placeholder="Ej. Go live → Discord + X"
        />
      </div>

      <div className="flex flex-col items-stretch max-w-md mx-auto">
        {/* IF node */}
        <div
          className={`rounded-xl border-2 bg-gradient-to-br p-4 shadow-sm ${triggerGradient}`}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">IF — Trigger</p>
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300/80 dark:border-gray-600 bg-white/90 dark:bg-gray-800 text-sm font-medium mb-2"
          >
            {(catalog.triggers || []).map((t) => (
              <option key={t.id || t} value={t.id || t}>
                {t.label || t}
              </option>
            ))}
          </select>
          {triggerMeta?.description ? (
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{triggerMeta.description}</p>
          ) : null}
          <input
            type="text"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="Filtro plataforma (opcional): twitch, discord…"
            className="w-full px-2 py-1.5 rounded-lg border border-gray-300/80 dark:border-gray-600 bg-white/80 dark:bg-gray-900 text-xs"
          />
        </div>

        <FlowConnector />

        {/* THEN nodes */}
        <div className="space-y-0">
          {actions.map((action, index) => {
            const meta = actionMeta(action.type);
            return (
              <React.Fragment key={index}>
                <div className="rounded-xl border-2 border-sky-400/35 bg-gradient-to-br from-sky-500/15 to-cyan-500/5 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300">
                      THEN {index + 1}
                    </p>
                    <button type="button" onClick={() => removeAction(index)} className="text-red-500 p-1" aria-label="Quitar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <select
                    value={action.type}
                    onChange={(e) => updateAction(index, { type: e.target.value, params: {} })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm mb-2"
                  >
                    {(catalog.actions || []).map((a) => (
                      <option key={a.type} value={a.type}>
                        {a.label || a.type}
                      </option>
                    ))}
                  </select>
                  {meta?.description ? (
                    <p className="text-xs text-gray-500 mb-2">{meta.description}</p>
                  ) : null}
                  {(meta?.params || []).map((param) => (
                    <input
                      key={param.key}
                      type="text"
                      value={action.params?.[param.key] || ''}
                      onChange={(e) => updateActionParam(index, param.key, e.target.value)}
                      placeholder={param.label}
                      className="w-full mt-1.5 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                    />
                  ))}
                </div>
                {index < actions.length - 1 ? <FlowConnector /> : null}
              </React.Fragment>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addAction}
          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 border-dashed border-sky-400/40 text-sky-700 dark:text-sky-300 text-sm font-medium hover:bg-sky-500/10 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Añadir acción THEN
        </button>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">
            Cancelar
          </button>
        ) : null}
        <button type="submit" disabled={saving} className="btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50">
          {saving ? 'Guardando…' : 'Guardar automatización'}
        </button>
      </div>
    </form>
  );
}
