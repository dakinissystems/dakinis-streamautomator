/**
 * Base domain event — versioned contract for outbox / timeline.
 */

/**
 * @param {{
 *   type: string;
 *   eventVersion?: string;
 *   schemaVersion?: number;
 *   aggregateId: string;
 *   aggregateType: string;
 *   workspaceId?: string | null;
 *   product?: string | null;
 *   origin?: string | null;
 *   actorId?: string | null;
 *   correlationId?: string | null;
 *   traceId?: string | null;
 *   retryCount?: number;
 *   payload: object;
 *   occurredAt?: Date;
 * }} props
 */
export function createDomainEvent(props) {
  return {
    type: props.type,
    eventVersion: props.eventVersion ?? "v1",
    schemaVersion: props.schemaVersion ?? 1,
    aggregateId: props.aggregateId,
    aggregateType: props.aggregateType,
    workspaceId: props.workspaceId ?? null,
    product: props.product ?? "platform",
    origin: props.origin ?? "domain",
    actorId: props.actorId ?? null,
    correlationId: props.correlationId ?? null,
    traceId: props.traceId ?? null,
    retryCount: props.retryCount ?? 0,
    payload: props.payload,
    occurredAt: (props.occurredAt ?? new Date()).toISOString(),
  };
}
