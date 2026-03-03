import { FrameworkContext, IGameModule } from '../../framework/app/FrameworkTypes';
import { CachePolicy } from '../../framework/res/ResTypes';

export class SlotsModule implements IGameModule {
  public readonly id = 'slots';
  public readonly bundle = 'game/slots';
  public readonly routes = [
    { name: 'slotsHud', bundle: this.bundle, path: 'ui/SlotsHudView', layer: 'hud' as const, cache: CachePolicy.KEEP },
  ];

  public async onEnter(ctx: FrameworkContext): Promise<void> {
    await ctx.ui.push('slotsHud');
  }

  public async onExit(ctx: FrameworkContext): Promise<void> {
    // Demo: clear hud manually from caller if needed.
  }
}
