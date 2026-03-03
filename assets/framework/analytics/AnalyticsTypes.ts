export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

export interface AnalyticsEvent {
  name: string;
  props?: AnalyticsProps;
}

export interface IAnalyticsAdapter {
  init?(): Promise<void> | void;
  track(event: AnalyticsEvent): void;
  setUser(userId: string): void;
  flush?(): Promise<void> | void;
}
