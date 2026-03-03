import { IAnalyticsAdapter, AnalyticsEvent } from './AnalyticsTypes';

class ConsoleAnalyticsAdapter implements IAnalyticsAdapter {
  private userId = '';

  public track(event: AnalyticsEvent): void {
    console.log('[analytics]', this.userId ? `uid=${this.userId}` : '', event.name, event.props ?? {});
  }

  public setUser(userId: string): void {
    this.userId = userId;
  }
}

export class AnalyticsService {
  private adapter: IAnalyticsAdapter;

  public constructor(adapter?: IAnalyticsAdapter) {
    this.adapter = adapter ?? new ConsoleAnalyticsAdapter();
  }

  public setAdapter(adapter: IAnalyticsAdapter): void {
    this.adapter = adapter;
  }

  public async init(): Promise<void> {
    await this.adapter.init?.();
  }

  public track(name: string, props?: AnalyticsEvent['props']): void {
    this.adapter.track({ name, props });
  }

  public setUser(userId: string): void {
    this.adapter.setUser(userId);
  }

  public async flush(): Promise<void> {
    await this.adapter.flush?.();
  }
}
