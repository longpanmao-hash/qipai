export interface IState<TContext = unknown> {
  name: string;
  onEnter?(prev: string | null, context: TContext): void;
  onUpdate?(dt: number, context: TContext): void;
  onExit?(next: string | null, context: TContext): void;
}

export class StateMachine<TContext = unknown> {
  private states = new Map<string, IState<TContext>>();
  private current: IState<TContext> | null = null;

  public constructor(private readonly context: TContext) {}

  public add(state: IState<TContext>): this {
    this.states.set(state.name, state);
    return this;
  }

  public remove(name: string): this {
    if (this.current?.name === name) {
      this.current.onExit?.(null, this.context);
      this.current = null;
    }
    this.states.delete(name);
    return this;
  }

  public enter(name: string): boolean {
    const next = this.states.get(name);
    if (!next) return false;
    if (this.current?.name === name) return true;

    const prevName = this.current?.name ?? null;
    this.current?.onExit?.(name, this.context);
    this.current = next;
    next.onEnter?.(prevName, this.context);
    return true;
  }

  public update(dt: number): void {
    this.current?.onUpdate?.(dt, this.context);
  }

  public get currentStateName(): string | null {
    return this.current?.name ?? null;
  }

  public clear(): void {
    this.current?.onExit?.(null, this.context);
    this.current = null;
    this.states.clear();
  }
}
