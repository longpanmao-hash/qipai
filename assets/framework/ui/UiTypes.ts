import { CachePolicy } from '../res/ResTypes';

export interface IUiRoute {
  name: string;
  bundle: string;
  path: string;
  layer: 'page' | 'popup' | 'hud';
  cache?: CachePolicy;
}

export interface PopupOptions {
  queue?: boolean;
  maskClose?: boolean;
}
