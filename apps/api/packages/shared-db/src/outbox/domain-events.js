/**
 * Map @dakinis/domain events → meta.outbox_events rows (versioned type).
 */

/**
 * @param {object} domainEvent from createDomainEvent()
 * @returns {{
 *   aggregateType: string;
 *   aggregateId: string;
 *   eventType: string;
 *   payload: object;
 *   idempotencyKey: string;
 * }}
 */
export function toOutboxInput(domainEvent) {
  const version = domainEvent.eventVersion || "v1";
  const eventType = `${domainEvent.type}.${version}`;
  const idempotencyKey =
    domainEvent.correlationId ||
    `outbox:${eventType}:${domainEvent.aggregateType}:${domainEvent.aggregateId}:${domainEvent.occurredAt}`;

  return {
    aggregateType: domainEvent.aggregateType,
    aggregateId: String(domainEvent.aggregateId),
    eventType,
    payload: {
      ...domainEvent.payload,
      _domain: {
        type: domainEvent.type,
        eventVersion: version,
        schemaVersion: domainEvent.schemaVersion ?? 1,
        workspaceId: domainEvent.workspaceId ?? null,
        product: domainEvent.product ?? null,
        origin: domainEvent.origin ?? null,
        actorId: domainEvent.actorId ?? null,
        correlationId: domainEvent.correlationId ?? null,
        traceId: domainEvent.traceId ?? null,
        occurredAt: domainEvent.occurredAt,
      },
    },
    idempotencyKey,
  };
}

/**
 * @param {import('./publisher.js').OutboxPublisher} publisher
 * @param {object[]} domainEvents
 * @param {(text: string, params?: unknown[]) => Promise<unknown>} [queryFn]
 */
export async function publishDomainEvents(publisher, domainEvents, queryFn) {
  const results = [];
  for (const event of domainEvents || []) {
    const input = toOutboxInput(event);
    results.push(await publisher.publish(input, queryFn));
  }
  return results;
}
