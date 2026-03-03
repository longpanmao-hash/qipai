import { sys } from 'cc';

export class StorageService {
  public getString(key: string, defaultValue = ''): string {
    const v = sys.localStorage.getItem(key);
    return v ?? defaultValue;
  }

  public setString(key: string, value: string): void {
    sys.localStorage.setItem(key, value);
  }

  public getJson<T>(key: string, defaultValue: T): T {
    const raw = this.getString(key, '');
    if (!raw) return defaultValue;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  public setJson<T>(key: string, value: T): void {
    this.setString(key, JSON.stringify(value));
  }

  public remove(key: string): void {
    sys.localStorage.removeItem(key);
  }
}
