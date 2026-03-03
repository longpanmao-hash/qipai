export type EventHandler<T = unknown> = (payload: T) => void;

interface Subscription {
  event: string;
  handler: EventHandler;
  once: boolean;
  owner?: object;
}

/**
 * EventBus with owner based auto-dispose.
 * Pass `this` as owner to `on/once`, then call `offByOwner(this)` in `onClose`/`onDestroy`.
 */
export class EventBus {
  private listeners = new Map<string, Set<Subscription>>();
  private ownerMap = new Map<object, Set<Subscription>>();

  public on<T>(event: string, handler: EventHandler<T>, owner?: object): () => void {
    return this.bind(event, handler as EventHandler, false, owner);
  }

  public once<T>(event: string, handler: EventHandler<T>, owner?: object): () => void {
    return this.bind(event, handler as EventHandler, true, owner);
  }

  public off(event: string, handler?: EventHandler): void {
    const set = this.listeners.get(event);
    if (!set) return;

    if (!handler) {
      for (const sub of Array.from(set)) this.detach(sub);
      this.listeners.delete(event);
      return;
    }

    for (const sub of Array.from(set)) {
      if (sub.handler === handler) this.detach(sub);
    }
  }

  public offByOwner(owner: object): void {
    const owned = this.ownerMap.get(owner);
    if (!owned) return;
    for (const sub of Array.from(owned)) this.detach(sub);
    this.ownerMap.delete(owner);
  }

  public emit<T>(event: string, payload?: T): void {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return;

    for (const sub of Array.from(set)) {
      sub.handler(payload);
      if (sub.once) this.detach(sub);
    }
  }

  public clear(): void {
    this.listeners.clear();
    this.ownerMap.clear();
  }

  private bind(event: string, handler: EventHandler, once: boolean, owner?: object): () => void {
    const sub: Subscription = { event, handler, once, owner };
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(sub);

    if (owner) {
      let owned = this.ownerMap.get(owner);
      if (!owned) {
        owned = new Set();
        this.ownerMap.set(owner, owned);
      }
      owned.add(sub);
    }

    return () => this.detach(sub);
  }

  private detach(sub: Subscription): void {
    const set = this.listeners.get(sub.event);
    if (set) {
      set.delete(sub);
      if (set.size === 0) this.listeners.delete(sub.event);
    }

    if (sub.owner) {
      const owned = this.ownerMap.get(sub.owner);
      if (owned) {
        owned.delete(sub);
        if (owned.size === 0) this.ownerMap.delete(sub.owner);
      }
    }
  }
}
