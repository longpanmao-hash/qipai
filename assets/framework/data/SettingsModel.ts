import { ObservableValue } from './Observable';
import { StorageService } from './StorageService';

export interface SettingsData {
  bgm: boolean;
  sfx: boolean;
  vibrate: boolean;
  language: string;
}

const KEY = 'fw_settings';

export class SettingsModel {
  public readonly bgm = new ObservableValue<boolean>(true);
  public readonly sfx = new ObservableValue<boolean>(true);
  public readonly vibrate = new ObservableValue<boolean>(true);
  public readonly language = new ObservableValue<string>('zh');

  public constructor(private readonly storage: StorageService) {}

  public load(): void {
    const data = this.storage.getJson<SettingsData>(KEY, {
      bgm: true,
      sfx: true,
      vibrate: true,
      language: 'zh',
    });
    this.bgm.value = data.bgm;
    this.sfx.value = data.sfx;
    this.vibrate.value = data.vibrate;
    this.language.value = data.language;
  }

  public save(): void {
    this.storage.setJson<SettingsData>(KEY, {
      bgm: this.bgm.value,
      sfx: this.sfx.value,
      vibrate: this.vibrate.value,
      language: this.language.value,
    });
  }

  public disposeOwner(owner: object): void {
    this.bgm.unsubscribeByOwner(owner);
    this.sfx.unsubscribeByOwner(owner);
    this.vibrate.unsubscribeByOwner(owner);
    this.language.unsubscribeByOwner(owner);
  }
}
