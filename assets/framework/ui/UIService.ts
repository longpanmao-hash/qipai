import { Label, Node, _decorator, Component } from 'cc';
import { FrameworkContext } from '../app/FrameworkTypes';
import { Logger } from '../logger/Logger';
import { ResService } from '../res/ResService';
import { IUiRoute, PopupOptions } from './UiTypes';
import { UIViewBase } from './UIViewBase';

const { ccclass } = _decorator;

interface PopupTask {
  routeName: string;
  params?: unknown;
  options?: PopupOptions;
}

@ccclass('UIService')
export class UIService extends Component {
  private ctx!: FrameworkContext;
  private res!: ResService;

  private routes = new Map<string, IUiRoute>();
  private pageStack: Node[] = [];
  private popupQueue: PopupTask[] = [];
  private currentPopup: Node | null = null;

  public setup(ctx: FrameworkContext, pageRoot: Node, popupRoot: Node, hudRoot: Node): void {
    this.ctx = ctx;
    this.res = ctx.res;
    this.pageRoot = pageRoot;
    this.popupRoot = popupRoot;
    this.hudRoot = hudRoot;
  }

  public pageRoot!: Node;
  public popupRoot!: Node;
  public hudRoot!: Node;

  public registerRoutes(routes: IUiRoute[]): void {
    routes.forEach((r) => this.routes.set(r.name, r));
  }

  public unregisterRoutes(names: string[]): void {
    names.forEach((name) => this.routes.delete(name));
  }

  public async push(routeName: string, params?: unknown): Promise<Node> {
    const route = this.requireRoute(routeName);
    const parent = route.layer === 'page' ? this.pageRoot : route.layer === 'popup' ? this.popupRoot : this.hudRoot;
    const node = await this.res.instantiate(route, parent);
    const view = node.getComponent(UIViewBase);
    view?.bindContext(this.ctx);
    view?.onOpen(params);

    if (route.layer === 'page') this.pageStack.push(node);
    if (route.layer === 'popup') this.currentPopup = node;
    return node;
  }

  public popPage(): void {
    const node = this.pageStack.pop();
    if (!node) return;
    node.getComponent(UIViewBase)?.onClose();
    node.destroy();
  }

  public close(node: Node): void {
    node.getComponent(UIViewBase)?.onClose();
    if (this.currentPopup === node) {
      this.currentPopup = null;
      this.flushPopupQueue();
    }
    this.pageStack = this.pageStack.filter((p) => p !== node);
    node.destroy();
  }

  public openPopup(routeName: string, params?: unknown, options?: PopupOptions): void {
    if (options?.queue && this.currentPopup) {
      this.popupQueue.push({ routeName, params, options });
      return;
    }

    void this.push(routeName, params);
  }

  public toast(message: string, durationSec = 1.2): void {
    const node = new Node('toast');
    const label = node.addComponent(Label);
    label.string = message;
    this.hudRoot.addChild(node);
    this.ctx.clock.setTimeout(() => node.destroy(), durationSec, node);
  }

  public showLoading(text = 'Loading...'): Node {
    const n = new Node('loading');
    const label = n.addComponent(Label);
    label.string = text;
    this.hudRoot.addChild(n);
    return n;
  }

  public hideLoading(node: Node | null): void {
    node?.destroy();
  }

  private flushPopupQueue(): void {
    const next = this.popupQueue.shift();
    if (!next) return;
    this.openPopup(next.routeName, next.params, next.options);
  }

  private requireRoute(name: string): IUiRoute {
    const route = this.routes.get(name);
    if (!route) {
      Logger.error('UIService', `route not found: ${name}`);
      throw new Error(`route not found: ${name}`);
    }
    return route;
  }
}
