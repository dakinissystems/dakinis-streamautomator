import { describe, it, expect } from "vitest";
import { OutboxPublisher } from "../src/outbox/publisher.js";

describe("OutboxPublisher", () => {
  it("deduplicates by idempotency_key", async () => {
    const rows = [];
    const query = async (sql, params) => {
      if (sql.includes("INSERT INTO meta.outbox_events")) {
        const key = params[4];
        if (rows.some((r) => r.idempotency_key === key)) {
          return { rows: [] };
        }
        const row = {
          id: `id-${rows.length + 1}`,
          created_at: new Date().toISOString(),
          idempotency_key: key,
        };
        rows.push(row);
        return { rows: [row] };
      }
      if (sql.includes("WHERE idempotency_key")) {
        const key = params[0];
        const hit = rows.find((r) => r.idempotency_key === key);
        return { rows: hit ? [hit] : [] };
      }
      return { rows: [] };
    };

    const publisher = new OutboxPublisher(query);
    const input = {
      aggregateType: "workspace_addon_data",
      aggregateId: "ws:kanban",
      eventType: "workspace.addon_data.saved",
      payload: { revision: 1 },
    };

    const first = await publisher.publish(input);
    const second = await publisher.publish(input);
    expect(first.id).toBe("id-1");
    expect(second.id).toBe("id-1");
    expect(rows).toHaveLength(1);
  });

  it("honors custom idempotencyKey", async () => {
    const rows = [];
    const query = async (sql, params) => {
      if (sql.includes("INSERT INTO meta.outbox_events")) {
        const row = {
          id: "custom-1",
          created_at: new Date().toISOString(),
          idempotency_key: params[4],
        };
        rows.push(row);
        return { rows: [row] };
      }
      return { rows: [] };
    };

    const publisher = new OutboxPublisher(query);
    await publisher.publish({
      aggregateType: "stream",
      aggregateId: "s1",
      eventType: "director.started",
      payload: {},
      idempotencyKey: "custom:key:1",
    });
    expect(rows[0].idempotency_key).toBe("custom:key:1");
  });
});
