/**
 * Lightweight state machine (no XState dependency).
 */

/**
 * @template {string} S
 * @template {string} E
 * @typedef {{ initialState: S; states: Record<S, { on?: Partial<Record<E, S>>; entry?: (ctx: object) => void; exit?: (ctx: object) => void }> }} StateMachineConfig
 */

/**
 * @template {string} S
 * @template {string} E
 */
export class StateMachine {
  /** @type {S} */
  #state;

  /**
   * @param {StateMachineConfig<S, E>} config
   * @param {S} [initialOverride]
   */
  constructor(config, initialOverride) {
    this.config = config;
    this.#state = initialOverride ?? config.initialState;
  }

  /** @returns {S} */
  get state() {
    return this.#state;
  }

  /**
   * @param {E} event
   * @param {object} [context]
   */
  can(event, context = {}) {
    const stateConfig = this.config.states[this.#state];
    return Boolean(stateConfig?.on?.[event]);
  }

  /**
   * @param {E} event
   * @param {object} [context]
   */
  transition(event, context = {}) {
    const stateConfig = this.config.states[this.#state];
    const next = stateConfig?.on?.[event];
    if (!next) return false;

    if (stateConfig.exit) stateConfig.exit(context);
    this.#state = next;
    const nextConfig = this.config.states[next];
    if (nextConfig?.entry) nextConfig.entry(context);
    return true;
  }
}
