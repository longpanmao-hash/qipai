export type Observer<T> = (value: T, prev: T) => void;

interface Subscription<T> {
  cb: Observer<T>;
  owner?: object;
}

export class ObservableValue<T> {
  private subs = new Set<Subscription<T>>();
  private ownerMap = new Map<object, Set<Subscription<T>>>();

  public constructor(private _value: T) {}

  public get value(): T {
    return this._value;
  }

  public set value(v: T) {
    if (Object.is(v, this._value)) return;
    const prev = this._value;
    this._value = v;
    for (const sub of Array.from(this.subs)) sub.cb(v, prev);
  }

  public subscribe(cb: Observer<T>, owner?: object, emitImmediately = false): () => void {
    const sub: Subscription<T> = { cb, owner };
    this.subs.add(sub);

    if (owner) {
      let set = this.ownerMap.get(owner);
      if (!set) {
        set = new Set();
        this.ownerMap.set(owner, set);
      }
      set.add(sub);
    }

    if (emitImmediately) cb(this._value, this._value);

    return () => this.unsubscribe(cb);
  }

  public unsubscribe(cb: Observer<T>): void {
    for (const sub of Array.from(this.subs)) {
      if (sub.cb === cb) this.detach(sub);
    }
  }

  public unsubscribeByOwner(owner: object): void {
    const owned = this.ownerMap.get(owner);
    if (!owned) return;
    for (const sub of Array.from(owned)) this.detach(sub);
    this.ownerMap.delete(owner);
  }

  public clear(): void {
    this.subs.clear();
    this.ownerMap.clear();
  }

  private detach(sub: Subscription<T>): void {
    this.subs.delete(sub);
    if (sub.owner) {
      const owned = this.ownerMap.get(sub.owner);
      if (owned) {
        owned.delete(sub);
        if (owned.size === 0) this.ownerMap.delete(sub.owner);
      }
    }
  }
}
