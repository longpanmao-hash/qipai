import { _decorator, Component } from 'cc';
import { FrameworkBootstrap } from '../app/FrameworkBootstrap';
import { DebugPanelConfig } from './DebugPanelConfig';

const { ccclass } = _decorator;

@ccclass('DebugPanel')
export class DebugPanel extends Component {
  private config: DebugPanelConfig | null = null;
  private visible = false;

  public setup(config: DebugPanelConfig): void {
    this.config = config;
    this.visible = Boolean(config.enabled);
    this.node.active = this.visible;
  }

  public show(): void {
    if (!this.isEnabled()) return;
    this.visible = true;
    this.node.active = true;
  }

  public hide(): void {
    this.visible = false;
    this.node.active = false;
  }

  public toggle(): void {
    if (this.visible) this.hide();
    else this.show();
  }

  public async onEnterModule(): Promise<void> {
    const moduleId = this.config?.enterModuleId;
    if (!this.isEnabled() || !moduleId) return;
    await this.config?.moduleManager.enter(moduleId);
  }

  public async onExitModule(): Promise<void> {
    const moduleId = this.config?.moduleManager.getCurrentModuleId();
    if (!this.isEnabled() || !moduleId) return;
    await this.config?.moduleManager.exit(moduleId);
  }

  public onDisconnect(): void {
    if (!this.isEnabled()) return;
    FrameworkBootstrap.getContext().net.disconnect();
  }

  public async onReconnect(): Promise<void> {
    if (!this.isEnabled()) return;
    const url = this.config?.reconnectUrl;
    if (!url) return;
    await FrameworkBootstrap.getContext().net.connect(url);
  }

  public onResGC(): void {
    if (!this.isEnabled()) return;
    FrameworkBootstrap.getContext().res.gc();
  }

  public onClearPopups(): void {
    if (!this.isEnabled()) return;
    FrameworkBootstrap.getContext().ui.clearPopupQueue();
  }

  private isEnabled(): boolean {
    return Boolean(this.config?.enabled);
  }
}
