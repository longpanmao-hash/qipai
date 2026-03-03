import { ClockService } from '../base/ClockService';
import { EventBus } from '../base/EventBus';
import { AnalyticsService } from '../analytics/AnalyticsService';
import { DataCenter } from '../data/DataCenter';
import { NetService } from '../net/NetService';
import { PlatformService } from '../platform/PlatformService';
import { ResService } from '../res/ResService';
import { IUiRoute } from '../ui/UiTypes';
import { UIService } from '../ui/UIService';

export interface FrameworkContext {
  events: EventBus;
  clock: ClockService;
  analytics: AnalyticsService;
  platform: PlatformService;
  data: DataCenter;
  res: ResService;
  ui: UIService;
  net: NetService;
}

export interface IGameModule {
  id: string;
  bundle: string;
  routes: IUiRoute[];
  registerNet?(ctx: FrameworkContext): void;
  unregisterNet?(ctx: FrameworkContext): void;
  onEnter(ctx: FrameworkContext): Promise<void> | void;
  onExit?(ctx: FrameworkContext): Promise<void> | void;
}
