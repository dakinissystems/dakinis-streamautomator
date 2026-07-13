/**
 * Visual IF/THEN automation rule builder.
 */
import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import {
  createAutomationRule,
  getAutomationCatalog,
  updateAutomationRule,
} from '../api/creatorApi.js';

const EMPTY_ACTION = { type: 'platform.notification', params: { title: 'StreamAutomator', body: '' } };

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
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          {rule?.id ? 'Editar regla' : 'Nueva regla IF/THEN'}
        </h2>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="p-1 text-gray-500 hover:text-gray-700" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          placeholder="Ej. Go live → Discord"
        />
      </div>

      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300 mb-2">IF</p>
        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Trigger</label>
        <select
          value={triggerType}
          onChange={(e) => setTriggerType(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 mb-2"
        >
          {(catalog.triggers || []).map((t) => (
            <option key={t.id || t} value={t.id || t}>
              {t.label || t}
            </option>
          ))}
        </select>
        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Plataforma (opcional)</label>
        <input
          type="text"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          placeholder="twitch, discord…"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        />
      </div>

      <div className="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50/80 dark:bg-sky-950/20 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-800 dark:text-sky-300">THEN</p>
          <button type="button" onClick={addAction} className="text-xs inline-flex items-center gap-1 text-sky-700 dark:text-sky-300">
            <Plus className="w-3.5 h-3.5" />
            Acción
          </button>
        </div>
        {actions.map((action, index) => {
          const meta = actionMeta(action.type);
          return (
            <div key={index} className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
              <div className="flex gap-2 items-start">
                <select
                  value={action.type}
                  onChange={(e) => updateAction(index, { type: e.target.value, params: {} })}
                  className="flex-1 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                >
                  {(catalog.actions || []).map((a) => (
                    <option key={a.type} value={a.type}>
                      {a.label || a.type}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => removeAction(index)} className="text-red-500 p-1" aria-label="Quitar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {meta?.description ? (
                <p className="text-xs text-gray-500 mt-1">{meta.description}</p>
              ) : null}
              {(meta?.params || []).map((param) => (
                <input
                  key={param.key}
                  type="text"
                  value={action.params?.[param.key] || ''}
                  onChange={(e) => updateActionParam(index, param.key, e.target.value)}
                  placeholder={param.label}
                  className="w-full mt-2 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                />
              ))}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">
            Cancelar
          </button>
        ) : null}
        <button type="submit" disabled={saving} className="btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50">
          {saving ? 'Guardando…' : 'Guardar regla'}
        </button>
      </div>
    </form>
  );
}
