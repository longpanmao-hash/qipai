import { sys } from 'cc';
import { IPlatformService } from './PlatformTypes';

class MockPlatformService implements IPlatformService {
  public async login(): Promise<{ userId: string; token: string }> {
    return { userId: 'mock_user', token: 'mock_token' };
  }

  public vibrate(_durationMs = 30): void {
    // Cocos does not expose uniform vibrate on all platforms.
  }

  public getSystemLanguage(): string {
    return sys.language;
  }

  public getNetworkType(): string {
    return 'unknown';
  }

  public copyText(text: string): void {
    console.log('[platform] copy text:', text);
  }
}

export class PlatformService {
  private impl: IPlatformService;

  public constructor(impl?: IPlatformService) {
    this.impl = impl ?? new MockPlatformService();
  }

  public setImpl(impl: IPlatformService): void {
    this.impl = impl;
  }

  public get api(): IPlatformService {
    return this.impl;
  }
}
