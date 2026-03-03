import { Asset, Prefab } from 'cc';

export enum CachePolicy {
  NONE = 'none',
  KEEP = 'keep',
  LRU = 'lru',
}

export interface LoadOptions {
  cache?: CachePolicy;
}

export interface PrefabRoute {
  bundle: string;
  path: string;
  cache?: CachePolicy;
}

export type AssetCtor<T extends Asset> = new (...args: any[]) => T;

export interface CacheItem {
  key: string;
  asset: Asset | Prefab;
  policy: CachePolicy;
  lastUseTime: number;
}
