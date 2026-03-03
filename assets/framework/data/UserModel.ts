import { ObservableValue } from './Observable';

export interface UserInfo {
  id: string;
  nickname: string;
  avatar: string;
  gold: number;
}

export class UserModel {
  public readonly user = new ObservableValue<UserInfo>({
    id: '',
    nickname: 'Guest',
    avatar: '',
    gold: 0,
  });

  public update(partial: Partial<UserInfo>): void {
    this.user.value = { ...this.user.value, ...partial };
  }

  public disposeOwner(owner: object): void {
    this.user.unsubscribeByOwner(owner);
  }
}
