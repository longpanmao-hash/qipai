import { IGameModule, FrameworkContext } from '../../framework/app/FrameworkTypes';
import { CachePolicy } from '../../framework/res/ResTypes';
import { createDdzNetHandlers } from './net/DdzNetHandlers';

export class DdzModule implements IGameModule {
  public readonly id = 'ddz';
  public readonly bundle = 'game/ddz';
  public readonly routes = [
    { name: 'ddzRoom', bundle: this.bundle, path: 'ui/DdzRoomView', layer: 'page' as const, cache: CachePolicy.KEEP },
  ];

  private removeHandlers: Array<() => void> = [];

  public registerNet(ctx: FrameworkContext): void {
    this.removeHandlers = createDdzNetHandlers(ctx);
  }

  public unregisterNet(): void {
    this.removeHandlers.forEach((off) => off());
    this.removeHandlers.length = 0;
  }

  public async onEnter(ctx: FrameworkContext): Promise<void> {
    await ctx.ui.push('ddzRoom');
  }

  public async onExit(ctx: FrameworkContext): Promise<void> {
    ctx.ui.popPage();
  }
}
