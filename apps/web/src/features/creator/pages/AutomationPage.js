/**
 * IF/THEN automation rules for creator workflows.
 */
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Zap, ToggleLeft, ToggleRight } from 'lucide-react';
import { getAutomationRules, seedAutomationDefaults, toggleAutomationRule } from '../api/creatorApi.js';

export default function AutomationPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRules(await getAutomationRules());
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cargar reglas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Zap className="w-8 h-8 text-accent" />
          Automatización
        </h1>
        <button type="button" onClick={onSeed} className="btn-primary px-4 py-2 rounded-lg text-sm">
          Crear reglas base
        </button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Reglas IF/THEN cuando empiezas directo o programas contenido. Se integran con AkoeNet Assistant y la
        plataforma Dakinis (eventos + notificaciones).
      </p>

      {loading ? (
        <p className="text-gray-500">Cargando…</p>
      ) : rules.length === 0 ? (
        <p className="text-gray-500">Sin reglas. Pulsa &quot;Crear reglas base&quot; para empezar.</p>
      ) : (
        <ul className="space-y-3">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{rule.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Trigger: <code>{rule.triggerType}</code> · {Array.isArray(rule.actions) ? rule.actions.length : 0}{' '}
                    acciones
                  </p>
                </div>
                <button type="button" onClick={() => onToggle(rule)} className="text-accent" aria-label="Toggle">
                  {rule.enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 opacity-50" />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
