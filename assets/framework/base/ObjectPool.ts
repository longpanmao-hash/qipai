export interface IPoolable {
  onSpawn?(): void;
  onDespawn?(): void;
}

export class ObjectPool<T extends IPoolable> {
  private free: T[] = [];

  public constructor(
    private readonly factory: () => T,
    private readonly maxSize = 100,
  ) {}

  public acquire(): T {
    const item = this.free.pop() ?? this.factory();
    item.onSpawn?.();
    return item;
  }

  public release(item: T): void {
    item.onDespawn?.();
    if (this.free.length < this.maxSize) this.free.push(item);
  }

  public warmup(count: number): void {
    for (let i = this.free.length; i < count; i += 1) {
      this.free.push(this.factory());
    }
  }

  public clear(): void {
    this.free.length = 0;
  }

  public get size(): number {
    return this.free.length;
  }
}
