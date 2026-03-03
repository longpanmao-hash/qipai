export interface IPlatformService {
  login(): Promise<{ userId: string; token: string }>;
  vibrate(durationMs?: number): void;
  getSystemLanguage(): string;
  getNetworkType(): string;
  copyText(text: string): void;
}
