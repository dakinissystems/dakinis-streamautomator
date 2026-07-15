import AutomationRule from '../infrastructure/AutomationRule.model.js';
import { listSupportedAutomationActions } from './automationExecutor.js';
import {
  syncAutomationRuleToStream,
  syncAutomationRuleDeleteToStream,
  readAutomationRulesFromStream,
  getAutomationRepository,
  isAutomationStreamReadEnabled,
} from '../../../lib/automationStreamSync.js';
import { publishPlatformOutbox } from '../../../lib/platformOutbox.js';

const TRIGGER_TYPES = ['stream.started', 'stream.scheduled', 'stream.ended'];

export function listTriggerTypes() {
  return TRIGGER_TYPES;
}

export async function listRules(userId) {
  const fromStream = await readAutomationRulesFromStream(userId);
  if (fromStream) return fromStream;

  return AutomationRule.findAll({
    where: { userId },
    order: [['updatedAt', 'DESC']],
  });
}

export async function createRule(userId, input) {
  const triggerType = String(input.triggerType || '').trim();
  if (!TRIGGER_TYPES.includes(triggerType)) {
    const err = new Error('invalid_trigger_type');
    err.status = 400;
    throw err;
  }
  const rule = await AutomationRule.create({
    userId,
    name: String(input.name || 'Automation').slice(0, 120),
    enabled: input.enabled !== false,
    triggerType,
    triggerConfig: input.triggerConfig || null,
    actions: Array.isArray(input.actions) ? input.actions : [],
  });
  await syncAutomationRuleToStream(rule, 'stream.automation.created');
  return rule;
}

export async function updateRule(userId, ruleId, patch) {
  const rule = await AutomationRule.findOne({ where: { id: ruleId, userId } });
  if (!rule) {
    const err = new Error('not_found');
    err.status = 404;
    throw err;
  }
  if (patch.name != null) rule.name = String(patch.name).slice(0, 120);
  if (patch.enabled != null) rule.enabled = Boolean(patch.enabled);
  if (patch.triggerType != null) {
    if (!TRIGGER_TYPES.includes(patch.triggerType)) {
      const err = new Error('invalid_trigger_type');
      err.status = 400;
      throw err;
    }
    rule.triggerType = patch.triggerType;
  }
  if (patch.triggerConfig !== undefined) rule.triggerConfig = patch.triggerConfig;
  if (patch.actions !== undefined) rule.actions = Array.isArray(patch.actions) ? patch.actions : [];
  await rule.save();
  await syncAutomationRuleToStream(rule, 'stream.automation.updated');
  return rule;
}

export async function deleteRule(userId, ruleId) {
  let legacyId = ruleId;

  if (isAutomationStreamReadEnabled()) {
    const repository = getAutomationRepository();
    if (repository) {
      const streamRef = await repository.findRuleRefForDelete(userId, ruleId);
      if (streamRef?.legacy_id) legacyId = streamRef.legacy_id;
      else if (streamRef && streamRef.legacy_id == null) {
        await repository.deleteByStreamId(streamRef.id);
        await publishPlatformOutbox({
          aggregateType: 'automation_rule',
          aggregateId: String(ruleId),
          eventType: 'stream.automation.deleted',
          payload: { streamId: streamRef.id, legacyId: null },
        });
        return;
      }
    }
  }

  const rule = await AutomationRule.findOne({ where: { id: legacyId, userId } });
  if (rule) {
    await AutomationRule.destroy({ where: { id: legacyId, userId } });
    await syncAutomationRuleDeleteToStream(legacyId);
    return;
  }

  if (isAutomationStreamReadEnabled()) {
    const repository = getAutomationRepository();
    if (repository) {
      const streamRow = await repository.findByLegacyId(legacyId);
      if (streamRow) {
        await repository.deleteByLegacyId(legacyId);
        await syncAutomationRuleDeleteToStream(legacyId);
        return;
      }
    }
  }

  const err = new Error('not_found');
  err.status = 404;
  throw err;
}

export async function seedDefaultRules(userId) {
  const existing = await AutomationRule.count({ where: { userId } });
  if (existing > 0) return { seeded: false, reason: 'already_has_rules' };

  const created = await AutomationRule.bulkCreate([
    {
      userId,
      name: 'Go live → Discord + AkoeNet',
      enabled: true,
      triggerType: 'stream.started',
      triggerConfig: null,
      actions: [
        { type: 'discord.announce', params: { message: '🔴 En directo' } },
        { type: 'platform.notification', params: { title: 'En directo', body: 'Tu stream ha comenzado' } },
      ],
    },
    {
      userId,
      name: 'Programar → plataforma + AkoeNet',
      enabled: true,
      triggerType: 'stream.scheduled',
      triggerConfig: null,
      actions: [
        { type: 'platform.event', params: { event: 'stream.scheduled' } },
        { type: 'akoenet.schedule_notify', params: {} },
      ],
    },
  ]);

  for (const rule of created) {
    await syncAutomationRuleToStream(rule, 'stream.automation.created');
  }

  return { seeded: true, count: created.length };
}

const TRIGGER_LABELS = {
  'stream.started': 'Cuando empieza el directo',
  'stream.scheduled': 'Cuando programas contenido',
  'stream.ended': 'Cuando termina el directo',
};

const ACTION_CATALOG = [
  {
    type: 'platform.event',
    label: 'Evento plataforma Dakinis',
    description: 'Emite evento al Internal API (Hub, Assistant)',
    params: [{ key: 'event', label: 'Tipo evento', optional: true }],
  },
  {
    type: 'akoenet.assistant',
    label: 'AkoeNet Assistant',
    description: 'Notifica al módulo Stream del Assistant',
    params: [{ key: 'type', label: 'Tipo', optional: true }],
  },
  {
    type: 'akoenet.schedule_notify',
    label: 'Aviso programación AkoeNet',
    description: 'Webhook de stream programado a tu servidor AkoeNet',
    params: [],
  },
  {
    type: 'discord.announce',
    label: 'Anunciar en Discord',
    description: 'Mensaje al webhook configurado en Ajustes',
    params: [{ key: 'message', label: 'Mensaje', optional: true }],
  },
  {
    type: 'timeline.log',
    label: 'Registrar en timeline',
    description: 'Añade entrada al timeline del streamer',
    params: [{ key: 'label', label: 'Etiqueta', optional: true }],
  },
  {
    type: 'platform.notification',
    label: 'Notificación in-app Dakinis',
    description: 'Push al workspace Hub (si IdP conectado)',
    params: [
      { key: 'title', label: 'Título', optional: true },
      { key: 'body', label: 'Cuerpo', optional: true },
    ],
  },
];

export function getAutomationCatalog() {
  return {
    triggers: TRIGGER_TYPES.map((id) => ({
      id,
      label: TRIGGER_LABELS[id] || id,
    })),
    actions: ACTION_CATALOG.filter((a) => listSupportedAutomationActions().includes(a.type)),
  };
}
