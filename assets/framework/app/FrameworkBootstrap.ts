import { director, game, Game } from 'cc';
import { AnalyticsService } from '../analytics/AnalyticsService';
import { IAnalyticsAdapter } from '../analytics/AnalyticsTypes';
import { ClockService } from '../base/ClockService';
import { EventBus } from '../base/EventBus';
import { DataCenter } from '../data/DataCenter';
import { NetService } from '../net/NetService';
import { ProtobufNumberCodec } from '../net/ProtobufNumberCodec';
import { IProtoRegistry } from '../net/NetTypes';
import { PlatformService } from '../platform/PlatformService';
import { IPlatformService } from '../platform/PlatformTypes';
import { ResService } from '../res/ResService';
import { UIService } from '../ui/UIService';
import { FrameworkContext } from './FrameworkTypes';

export interface BootstrapOptions {
  platform?: IPlatformService;
  analyticsAdapter?: IAnalyticsAdapter;
  protoRegistry?: IProtoRegistry;
}

export class FrameworkBootstrap {
  private static ctx: FrameworkContext | null = null;

  public static create(ui: UIService, options?: BootstrapOptions): FrameworkContext {
    const events = new EventBus();
    const clock = new ClockService();
    const data = new DataCenter();
    const platform = new PlatformService(options?.platform);
    const analytics = new AnalyticsService(options?.analyticsAdapter);
    const res = new ResService();
    const codec = new ProtobufNumberCodec(options?.protoRegistry);
    const net = new NetService(clock, codec);

    const ctx: FrameworkContext = { events, clock, platform, analytics, data, res, net, ui };
    this.ctx = ctx;

    data.loadAll();
    this.bindSettingsToRuntime(ctx);
    this.installClockTicker(clock);
    return ctx;
  }

  public static getContext(): FrameworkContext {
    if (!this.ctx) throw new Error('Framework context not initialized');
    return this.ctx;
  }

  private static bindSettingsToRuntime(ctx: FrameworkContext): void {
    ctx.data.settings.bgm.subscribe((v) => {
      director.getScene();
      console.log('[audio] bgm=', v);
    }, this);

    ctx.data.settings.sfx.subscribe((v) => {
      console.log('[audio] sfx=', v);
    }, this);
  }

  private static installClockTicker(clock: ClockService): void {
    game.on(Game.EVENT_POST_UPDATE, (_dt) => {
      clock.tick(game.deltaTime);
    });
  }
}
