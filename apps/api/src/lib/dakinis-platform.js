/**
 * StreamAutomator Internal platform client — thin mirror of @dakinis/sdk
 * (same idea as Hub createHubPlatform). Prefer this over raw dakinisInternalFetch
 * for new call sites; migrate existing ones gradually.
 */
import { dakinisInternalFetch, isDakinisInternalConfigured } from "./dakinisInternalClient.js";

/**
 * @returns {{
 *   knowledge: { query: (body: object) => Promise<object> };
 *   events: { publish: (body: object) => Promise<object> };
 *   notifications: { send: (body: object) => Promise<object> };
 * }}
 */
export function getPlatform() {
  return {
    knowledge: {
      /** @param {{ query: string; context?: object; sources?: string[] }} body */
      query(body) {
        return dakinisInternalFetch("/knowledge/query", { method: "POST", body });
      },
    },
    events: {
      /** @param {object} body */
      publish(body) {
        return dakinisInternalFetch("/events", { method: "POST", body });
      },
    },
    notifications: {
      /** @param {object} body */
      send(body) {
        return dakinisInternalFetch("/notifications/send", { method: "POST", body });
      },
    },
  };
}

export { isDakinisInternalConfigured };
