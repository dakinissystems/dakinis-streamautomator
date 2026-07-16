/**
 * Base aggregate — collects domain events raised during mutations.
 */
export class AggregateRoot {
  constructor() {
    /** @type {ReturnType<typeof import('./domain-event.js').createDomainEvent>[]} */
    this._events = [];
  }

  /** @returns {readonly ReturnType<typeof import('./domain-event.js').createDomainEvent>[]} */
  pullDomainEvents() {
    const events = [...this._events];
    this._events = [];
    return events;
  }

  /**
   * @param {ReturnType<typeof import('./domain-event.js').createDomainEvent>} event
   * @protected
   */
  _raise(event) {
    this._events.push(event);
  }
}
