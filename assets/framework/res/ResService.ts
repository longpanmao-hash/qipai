import { assetManager, Asset, AssetManager, instantiate, Node, Prefab } from 'cc';
import { CacheItem, CachePolicy, AssetCtor, LoadOptions, PrefabRoute } from './ResTypes';

export class ResService {
  private bundles = new Map<string, AssetManager.Bundle>();
  private cache = new Map<string, CacheItem>();

  public async loadBundle(name: string): Promise<AssetManager.Bundle> {
    const loaded = this.bundles.get(name);
    if (loaded) return loaded;

    const bundle = await new Promise<AssetManager.Bundle>((resolve, reject) => {
      assetManager.loadBundle(name, (err, b) => (err || !b ? reject(err) : resolve(b)));
    });
    this.bundles.set(name, bundle);
    return bundle;
  }

  public async unloadBundle(name: string): Promise<void> {
    const bundle = this.bundles.get(name);
    if (!bundle) return;

    for (const [key, item] of Array.from(this.cache.entries())) {
      if (key.startsWith(`${name}:`)) {
        this.releaseAsset(item.asset);
        this.cache.delete(key);
      }
    }

    bundle.releaseAll();
    assetManager.removeBundle(bundle);
    this.bundles.delete(name);
  }

  public async loadAsset<T extends Asset>(
    bundleName: string,
    path: string,
    type?: AssetCtor<T>,
    options?: LoadOptions,
  ): Promise<T> {
    const key = `${bundleName}:${path}`;
    const cached = this.cache.get(key);
    if (cached) {
      cached.lastUseTime = Date.now();
      return cached.asset as T;
    }

    const bundle = await this.loadBundle(bundleName);
    const asset = await new Promise<T>((resolve, reject) => {
      bundle.load(path, type as any, (err, data) => (err || !data ? reject(err) : resolve(data as T)));
    });

    const policy = options?.cache ?? CachePolicy.LRU;
    if (policy !== CachePolicy.NONE) {
      asset.addRef();
      this.cache.set(key, { key, asset, policy, lastUseTime: Date.now() });
    }

    return asset;
  }

  public async instantiate(route: PrefabRoute, parent?: Node): Promise<Node> {
    const prefab = await this.loadAsset<Prefab>(route.bundle, route.path, Prefab, { cache: route.cache });
    const node = instantiate(prefab);
    if (parent) parent.addChild(node);
    return node;
  }

  public gc(maxLruCount = 50): void {
    const lruItems = Array.from(this.cache.values())
      .filter((v) => v.policy === CachePolicy.LRU)
      .sort((a, b) => a.lastUseTime - b.lastUseTime);

    while (lruItems.length > maxLruCount) {
      const victim = lruItems.shift();
      if (!victim) break;
      this.releaseAsset(victim.asset);
      this.cache.delete(victim.key);
    }
  }

  public clearNoneCached(): void {
    // For explicitly loaded assets with policy NONE, callers keep references themselves.
  }

  private releaseAsset(asset: Asset): void {
    asset.decRef(false);
  }
}
