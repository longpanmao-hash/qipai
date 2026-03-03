import { FrameworkContext, IGameModule } from './FrameworkTypes';

export class ModuleManager {
  private modules = new Map<string, IGameModule>();
  private current: IGameModule | null = null;

  public constructor(private readonly ctx: FrameworkContext) {}

  public register(module: IGameModule): void {
    this.modules.set(module.id, module);
  }

  public async enter(id: string): Promise<void> {
    const next = this.modules.get(id);
    if (!next) throw new Error(`module not found: ${id}`);

    if (this.current) await this.exit(this.current.id);

    await this.ctx.res.loadBundle(next.bundle);
    this.ctx.ui.registerRoutes(next.routes);
    next.registerNet?.(this.ctx);
    await next.onEnter(this.ctx);
    this.current = next;
  }

  public async exit(id: string): Promise<void> {
    const module = this.modules.get(id);
    if (!module) return;

    await module.onExit?.(this.ctx);
    module.unregisterNet?.(this.ctx);
    this.ctx.ui.unregisterRoutes(module.routes.map((v) => v.name));
    await this.ctx.res.unloadBundle(module.bundle);

    if (this.current?.id === id) this.current = null;
  }
}
