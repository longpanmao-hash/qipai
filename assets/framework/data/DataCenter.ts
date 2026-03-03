import { SettingsModel } from './SettingsModel';
import { StorageService } from './StorageService';
import { UserModel } from './UserModel';

export class DataCenter {
  public readonly storage = new StorageService();
  public readonly settings = new SettingsModel(this.storage);
  public readonly user = new UserModel();

  public loadAll(): void {
    this.settings.load();
  }

  public saveAll(): void {
    this.settings.save();
  }
}
